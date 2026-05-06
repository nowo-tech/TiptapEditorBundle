<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle;

/**
 * Optional “recipe” presets that load extra Tiptap extensions in the bundle script (see {@see Form\TiptapEditorType} `example` option).
 *
 * Mirrors categories from the official examples hub: https://tiptap.dev/docs/examples
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
enum TiptapExample: string
{
    case Formatting         = 'formatting';
    case Images             = 'images';
    case LongText           = 'long_text';
    case MarkdownShortcuts  = 'markdown_shortcuts';
    case Minimal            = 'minimal';
    case Tables             = 'tables';
    case Tasks              = 'tasks';
    case TextDirectionRtl   = 'text_direction_rtl';
    case Menus              = 'menus';
    case SyntaxHighlighting = 'syntax_highlighting';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(static fn (self $c): string => $c->value, self::cases());
    }
}
