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
final readonly class TiptapHtmlSanitizeTransformer implements DataTransformerInterface
{
    /**
     * @param TiptapHtmlSanitizerInterface $sanitizer sanitizer applied to submitted HTML
     */
    public function __construct(
        private TiptapHtmlSanitizerInterface $sanitizer,
    ) {
    }

    /**
     * Model to view: the stored HTML is rendered unchanged.
     *
     * @param mixed $value the model value
     *
     * @return mixed the view value
     */
    public function transform(mixed $value): mixed
    {
        return $value;
    }

    /**
     * View to model: sanitizes submitted HTML strings; other values pass through.
     *
     * @param mixed $value the submitted value
     *
     * @return mixed the sanitized value
     */
    public function reverseTransform(mixed $value): mixed
    {
        if (!is_string($value)) {
            return $value;
        }

        return $this->sanitizer->sanitize($value);
    }
}
