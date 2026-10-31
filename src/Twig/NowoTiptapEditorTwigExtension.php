<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Twig;

use Nowo\TiptapEditorBundle\DependencyInjection\NowoTiptapEditorExtension;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

use function is_string;

/**
 * Twig helpers for loading the compiled Tiptap widget script and stylesheet from Resources/public after assets:install,
 * and the CSP nonce of the current request (1.7).
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class NowoTiptapEditorTwigExtension extends AbstractExtension
{
    /** Symfony asset package registered by {@see NowoTiptapEditorExtension::prepend()}. */
    public const ASSET_PACKAGE = 'nowo_tiptap_editor';

    /** Directory under public/bundles/ produced by `assets:install` for this bundle. */
    public const ASSET_DIR = 'nowotiptapeditor';

    private const DEFAULT_SCRIPT = 'tiptap-editor.js';

    private const SAFE_FILENAME_PATTERN = '#^[a-zA-Z0-9._/-]+$#';

    /** Request attribute holding the CSP nonce of the current response (the convention of the Nowo bundles). */
    public const CSP_NONCE_ATTRIBUTE = 'csp_nonce';

    /**
     * @param RequestStack|null $requestStack reads the CSP nonce of the current request (1.7; null = no nonce)
     */
    public function __construct(
        private readonly ?RequestStack $requestStack = null,
    ) {
    }

    /**
     * @return list<TwigFunction>
     */
    public function getFunctions(): array
    {
        return [
            new TwigFunction('nowo_tiptap_editor_asset_path', $this->assetPath(...), ['is_safe' => ['html']]),
            new TwigFunction('nowo_tiptap_editor_asset_package', static fn (): string => self::ASSET_PACKAGE),
            new TwigFunction('nowo_tiptap_editor_csp_nonce', $this->cspNonce(...)),
        ];
    }

    /**
     * The CSP nonce of the current request (request attribute {@see self::CSP_NONCE_ATTRIBUTE}), or null when there is
     * no request or no (string) nonce. The widget stylesheet link carries it.
     */
    public function cspNonce(): ?string
    {
        $request = $this->requestStack?->getCurrentRequest();
        if (!$request instanceof Request) {
            return null;
        }

        $nonce = $request->attributes->get(self::CSP_NONCE_ATTRIBUTE);

        return is_string($nonce) && $nonce !== '' ? $nonce : null;
    }

    /**
     * Builds a safe relative asset path inside the bundle public directory.
     *
     * @param string $filename Relative path (e.g. tiptap-editor.js)
     *
     * @return string Relative path for use with asset(..., nowo_tiptap_editor_asset_package())
     */
    public function assetPath(string $filename): string
    {
        $filename = ltrim($filename, '/');
        if ($filename === '' || str_contains($filename, '..') || preg_match(self::SAFE_FILENAME_PATTERN, $filename) !== 1) {
            return self::DEFAULT_SCRIPT;
        }

        return $filename;
    }
}
