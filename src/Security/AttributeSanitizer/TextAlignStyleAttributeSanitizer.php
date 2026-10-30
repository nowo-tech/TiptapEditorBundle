<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Security\AttributeSanitizer;

use Symfony\Component\HtmlSanitizer\HtmlSanitizerConfig;
use Symfony\Component\HtmlSanitizer\Visitor\AttributeSanitizer\AttributeSanitizerInterface;

use function strtolower;

/**
 * Keeps a `style` attribute only when it is exactly a Tiptap TextAlign declaration
 * (`text-align: left|center|right|justify`); any other CSS is dropped.
 *
 * @internal
 */
final class TextAlignStyleAttributeSanitizer implements AttributeSanitizerInterface
{
    /**
     * Elements whose `style` attribute is inspected (null = every element).
     *
     * @return list<string>|null the supported element names
     */
    public function getSupportedElements(): ?array
    {
        return null;
    }

    /**
     * Attributes handled by this sanitizer.
     *
     * @return list<string> the supported attribute names
     */
    public function getSupportedAttributes(): array
    {
        return ['style'];
    }

    /**
     * Keeps only a `text-align` declaration with an allowed value; drops anything else.
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
        if (preg_match('/^\s*text-align\s*:\s*(left|center|right|justify)\s*;?\s*$/i', $value, $matches) !== 1) {
            return null;
        }

        return 'text-align: ' . strtolower($matches[1]);
    }
}
