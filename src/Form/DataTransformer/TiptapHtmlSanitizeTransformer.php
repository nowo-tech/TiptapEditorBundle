<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Form\DataTransformer;

use Nowo\TiptapEditorBundle\Security\TiptapHtmlSanitizerInterface;
use Symfony\Component\Form\DataTransformerInterface;

use function is_string;

/**
 * Model transformer that sanitizes HTML on submit when a sanitizer is configured.
 *
 * @implements DataTransformerInterface<string|null, string|null>
 */
final class TiptapHtmlSanitizeTransformer implements DataTransformerInterface
{
    public function __construct(
        private readonly TiptapHtmlSanitizerInterface $sanitizer,
    ) {
    }

    public function transform(mixed $value): mixed
    {
        return $value;
    }

    public function reverseTransform(mixed $value): mixed
    {
        if (!is_string($value)) {
            return $value;
        }

        return $this->sanitizer->sanitize($value);
    }
}
