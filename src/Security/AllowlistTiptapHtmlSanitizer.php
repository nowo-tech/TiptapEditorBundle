<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Security;

use Nowo\TiptapEditorBundle\Security\AttributeSanitizer\EmbedIframeSrcAttributeSanitizer;
use Nowo\TiptapEditorBundle\Security\AttributeSanitizer\TextAlignStyleAttributeSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizer;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\HtmlSanitizerInterface;

use function array_merge;
use function in_array;

use const PREG_SPLIT_NO_EMPTY;

/**
 * Allowlist-based HTML sanitizer for Tiptap field values (mitigates stored XSS).
 *
 * Built on symfony/html-sanitizer (DOM parsing, per-element attribute allowlist): every attribute
 * not listed below (event handlers, `srcdoc`, arbitrary `style`, ...) is removed, links accept only
 * http/https/mailto (or relative) URLs, media only http/https (or relative), and iframes are kept
 * only with an https `src` on the embed host allowlist. Link `rel` values keep only known link types,
 * never `opener`, and every link with a `target` gets `noopener noreferrer` (no reverse tabnabbing).
 */
final readonly class AllowlistTiptapHtmlSanitizer implements TiptapHtmlSanitizerInterface
{
    /** @var list<string> */
    public const DEFAULT_EMBED_HOSTS = [
        'www.youtube.com',
        'youtube.com',
        'www.youtube-nocookie.com',
        'player.vimeo.com',
    ];

    /** Global attributes allowed on every allowlisted element. */
    private const COMMON_ATTRIBUTES = ['class', 'dir', 'lang', 'title'];

    /** @var array<string, list<string>> element => extra allowed attributes */
    private const ALLOWED_ELEMENTS = [
        'p'          => ['style'],
        'br'         => [],
        'strong'     => [],
        'b'          => [],
        'em'         => [],
        'i'          => [],
        'u'          => [],
        's'          => [],
        'del'        => [],
        'h1'         => ['style'],
        'h2'         => ['style'],
        'h3'         => ['style'],
        'h4'         => ['style'],
        'h5'         => ['style'],
        'h6'         => ['style'],
        'ul'         => ['data-type'],
        'ol'         => ['start', 'type'],
        'li'         => ['data-type', 'data-checked'],
        'blockquote' => [],
        'code'       => [],
        'pre'        => [],
        'a'          => ['href', 'target', 'rel'],
        'img'        => ['src', 'alt', 'width', 'height'],
        'table'      => [],
        'thead'      => [],
        'tbody'      => [],
        'tr'         => [],
        'th'         => ['colspan', 'rowspan', 'colwidth', 'style'],
        'td'         => ['colspan', 'rowspan', 'colwidth', 'style'],
        'caption'    => [],
        'hr'         => [],
        'span'       => [],
        'div'        => [],
        'figure'     => [],
        'figcaption' => [],
        'sub'        => [],
        'sup'        => [],
        'mark'       => [],
        'iframe'     => ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
    ];

    /**
     * `rel` link types kept on `<a>`; anything else (`opener` first of all) is dropped.
     *
     * @var list<string>
     */
    private const SAFE_LINK_REL_TOKENS = [
        'alternate', 'author', 'bookmark', 'external', 'help', 'license', 'me', 'next', 'nofollow', 'noopener',
        'noreferrer', 'prev', 'privacy-policy', 'search', 'sponsored', 'tag', 'terms-of-service', 'ugc',
    ];

    /** `target` values kept on `<a>`; any other (named) target becomes `_blank`. */
    private const SAFE_LINK_TARGETS = ['', '_blank', '_self', '_parent', '_top'];

    /** Harmless wrappers that are removed while their text content is kept (like strip_tags did). */
    private const BLOCKED_ELEMENTS = [
        'abbr', 'address', 'article', 'aside', 'big', 'center', 'cite', 'dd', 'dfn', 'dl', 'dt', 'font',
        'footer', 'header', 'ins', 'kbd', 'label', 'main', 'nav', 'q', 'samp', 'section', 'small', 'time', 'tfoot', 'var',
    ];

    private HtmlSanitizerInterface $sanitizer;

    /**
     * @param list<string> $allowedEmbedHosts Hosts allowed in `<iframe src="https://…">`
     */
    public function __construct(array $allowedEmbedHosts = self::DEFAULT_EMBED_HOSTS)
    {
        $config = (new HtmlSanitizerConfig())
            ->allowLinkSchemes(['http', 'https', 'mailto'])
            ->allowRelativeLinks()
            ->allowMediaSchemes(['http', 'https'])
            ->allowRelativeMedias()
            ->withMaxInputLength(-1)
            ->withAttributeSanitizer(new EmbedIframeSrcAttributeSanitizer($allowedEmbedHosts))
            ->withAttributeSanitizer(new TextAlignStyleAttributeSanitizer());

        foreach (self::ALLOWED_ELEMENTS as $element => $attributes) {
            $config = $config->allowElement($element, array_merge(self::COMMON_ATTRIBUTES, $attributes));
        }
        foreach (self::BLOCKED_ELEMENTS as $element) {
            $config = $config->blockElement($element);
        }

        $this->sanitizer = new HtmlSanitizer($config);
    }

    /**
     * Sanitizes the HTML with the allow-list, drops iframes whose `src` was rejected and secures link `rel` values.
     *
     * @param string $html raw HTML submitted by the editor
     *
     * @return string the sanitized HTML
     */
    public function sanitize(string $html): string
    {
        $html = $this->sanitizer->sanitize($html);

        // The sanitizer only drops a rejected iframe `src`; remove iframes left without one.
        // Output is canonical here (double-quoted, entity-encoded attributes), so this match is reliable.
        $html = preg_replace('#<iframe\b(?![^>]*\ssrc=")[^>]*>.*?</iframe>#is', '', $html) ?? $html;

        return $this->secureLinkRel($html);
    }

    /**
     * Keeps only {@see SAFE_LINK_REL_TOKENS} in `<a rel>` (so `rel="opener"` is gone) and adds `noopener noreferrer`
     * to every link with a `target`, so the opened page never gets `window.opener` (reverse tabnabbing).
     * Runs on the sanitizer's canonical output: double-quoted attributes whose values have `"` and `>` encoded.
     */
    private function secureLinkRel(string $html): string
    {
        return preg_replace_callback('#<a\b[^>]*>#i', static function (array $match): string {
            $tag       = $match[0];
            $hasTarget = preg_match('#\starget="#i', $tag) === 1;
            if ($hasTarget) {
                // Named targets expose window.opener and can navigate other frames: browsing contexts keywords only,
                // anything else becomes `_blank`. symfony/html-sanitizer >= 7.4.23 does this too; kept here so older
                // patch versions behave the same.
                $tag = preg_replace_callback('#(\starget=")([^"]*)(")#i', static fn (array $t): string => in_array(strtolower(trim($t[2])), self::SAFE_LINK_TARGETS, true) ? $t[0] : $t[1] . '_blank' . $t[3], $tag, 1) ?? $tag;
            }
            $rel       = preg_match('#\srel="([^"]*)"#i', $tag, $relMatch) === 1 ? $relMatch[1] : null;
            if (!$hasTarget && $rel === null) {
                return $tag;
            }

            $tokens = [];
            foreach (preg_split('/\s+/', strtolower($rel ?? ''), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $token) {
                if (in_array($token, self::SAFE_LINK_REL_TOKENS, true)) {
                    $tokens[$token] = true;
                }
            }
            if ($hasTarget) {
                $tokens['noopener']   = true;
                $tokens['noreferrer'] = true;
            }

            $tag = preg_replace('#\srel="[^"]*"#i', '', $tag) ?? $tag;
            if ($tokens === []) {
                return $tag;
            }

            return substr($tag, 0, -1) . ' rel="' . implode(' ', array_keys($tokens)) . '">';
        }, $html) ?? $html;
    }
}
