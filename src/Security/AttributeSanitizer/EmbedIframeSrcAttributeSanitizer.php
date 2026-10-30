<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Security\AttributeSanitizer;

use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\Visitor\AttributeSanitizer\AttributeSanitizerInterface;

use function array_map;
use function in_array;
use function is_array;
use function strtolower;

/**
 * Keeps `<iframe src>` only for https URLs whose host is on the embed allowlist.
 *
 * @internal
 */
final readonly class EmbedIframeSrcAttributeSanitizer implements AttributeSanitizerInterface
{
    /** @var list<string> */
    private array $allowedHosts;

    /**
     * @param list<string> $allowedHosts
     */
    public function __construct(array $allowedHosts)
    {
        $this->allowedHosts = array_map(strtolower(...), $allowedHosts);
    }

    /**
     * Elements handled by this sanitizer (`iframe`).
     *
     * @return list<string> the supported element names
     */
    public function getSupportedElements(): array
    {
        return ['iframe'];
    }

    /**
     * Attributes handled by this sanitizer (`src`).
     *
     * @return list<string> the supported attribute names
     */
    public function getSupportedAttributes(): array
    {
        return ['src'];
    }

    /**
     * Keeps an iframe `src` only when it is an https URL without credentials on an allowed host.
     *
     * @param string $element element name
     * @param string $attribute attribute name
     * @param string $value raw attribute value
     * @param HtmlSanitizerConfig $config sanitizer configuration
     *
     * @return string|null the safe value, or null to drop the attribute
     */
    public function sanitizeAttribute(string $element, string $attribute, string $value, HtmlSanitizerConfig $config): ?string
    {
        $parts = parse_url(trim($value));
        if (!is_array($parts)
            || strtolower($parts['scheme'] ?? '') !== 'https'
            || isset($parts['user'])
            || isset($parts['pass'])
            || !in_array(strtolower($parts['host'] ?? ''), $this->allowedHosts, true)
        ) {
            return null;
        }

        return $value;
    }
}
