<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Twig;

use Nowo\TiptapEditorBundle\DependencyInjection\NowoTiptapEditorExtension;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig helpers for loading the compiled Tiptap widget script from Resources/public after assets:install.
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

    /**
     * @return list<TwigFunction>
     */
    public function getFunctions(): array
    {
        return [
            new TwigFunction('nowo_tiptap_editor_asset_path', $this->assetPath(...), ['is_safe' => ['html']]),
            new TwigFunction('nowo_tiptap_editor_asset_package', static fn (): string => self::ASSET_PACKAGE),
        ];
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
