<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Twig;

use Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension
 */
final class NowoTiptapEditorTwigExtensionTest extends TestCase
{
    public function testGetFunctionsReturnsAssetPathFunction(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        $fns = $ext->getFunctions();

        self::assertCount(1, $fns);
        self::assertSame('nowo_tiptap_editor_asset_path', $fns[0]->getName());
    }

    public function testAssetPathReturnsPathWithAssetDir(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();

        self::assertSame('bundles/nowotiptapeditor/tiptap-editor.js', $ext->assetPath('tiptap-editor.js'));
        self::assertSame('bundles/nowotiptapeditor/tiptap-editor.js', $ext->assetPath('/tiptap-editor.js'));
    }

    public function testAssetPathRejectsPathTraversal(): void
    {
        $ext     = new NowoTiptapEditorTwigExtension();
        $default = 'bundles/' . NowoTiptapEditorTwigExtension::ASSET_DIR . '/tiptap-editor.js';
        self::assertSame($default, $ext->assetPath('../other/file.js'));
    }

    public function testAssetPathRejectsInvalidCharacters(): void
    {
        $ext     = new NowoTiptapEditorTwigExtension();
        $default = 'bundles/' . NowoTiptapEditorTwigExtension::ASSET_DIR . '/tiptap-editor.js';
        self::assertSame($default, $ext->assetPath('bad<script>.js'));
        self::assertSame($default, $ext->assetPath(''));
    }

    public function testAssetPathAllowsSubpath(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        self::assertSame('bundles/nowotiptapeditor/css/theme.css', $ext->assetPath('css/theme.css'));
    }
}
