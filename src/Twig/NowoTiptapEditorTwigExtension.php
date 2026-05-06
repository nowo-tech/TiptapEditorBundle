<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig helpers for loading the compiled Tiptap widget script from Resources/public after assets:install.
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class NowoTiptapEditorTwigExtension extends AbstractExtension
{
    /** Directory under public/bundles/ produced by `assets:install` for this bundle. */
    public const ASSET_DIR = 'nowotiptapeditor';

    private const SAFE_FILENAME_PATTERN = '#^[a-zA-Z0-9._/-]+$#';

    /**
     * @return list<TwigFunction>
     */
    public function getFunctions(): array
    {
        return [
            new TwigFunction('nowo_tiptap_editor_asset_path', $this->assetPath(...), ['is_safe' => ['html']]),
        ];
    }

    /**
     * Builds a safe asset path inside the bundle public directory.
     *
     * @param string $filename Relative path (e.g. tiptap-editor.js)
     *
     * @return string Path for use with asset(), e.g. bundles/nowotiptapeditor/tiptap-editor.js
     */
    public function assetPath(string $filename): string
    {
        $filename = ltrim($filename, '/');
        $default  = 'bundles/' . self::ASSET_DIR . '/tiptap-editor.js';
        if ($filename === '' || str_contains($filename, '..') || preg_match(self::SAFE_FILENAME_PATTERN, $filename) !== 1) {
            return $default;
        }

        return 'bundles/' . self::ASSET_DIR . '/' . $filename;
    }
}
