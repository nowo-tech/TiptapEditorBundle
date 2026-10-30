<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle;

/**
 * Visual/UX presets for the Tiptap widget (CSS + optional toolbar affordances in the bundle script).
 */
enum EditorVariant: string
{
    case Default = 'default';
    /** Plain textarea-like surface, minimal chrome. */
    case Simple = 'simple';
    /** Page-like “paper”, wider toolbar with headings (Notion-ish). */
    case Notion = 'notion';
    /** Labeled chrome aimed at AI/agent-assisted flows. */
    case Agent = 'agent';
    /** No bordered chrome: mount only (toolbar forced off in JS). */
    case Headless = 'headless';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $c): string => $c->value, self::cases());
    }

    /**
     * Parses a variant name (case-insensitive, trimmed), falling back to the default variant.
     *
     * @param string $value the variant name
     *
     * @return self the matching variant
     */
    public static function fromString(string $value): self
    {
        $v = strtolower(trim($value));

        return self::tryFrom($v) ?? self::Default;
    }
}
