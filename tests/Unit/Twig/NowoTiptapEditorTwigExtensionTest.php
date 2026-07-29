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
    public function testGetFunctionsReturnsAssetHelpers(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        $fns = $ext->getFunctions();

        self::assertCount(2, $fns);
        self::assertSame('nowo_tiptap_editor_asset_path', $fns[0]->getName());
        self::assertSame('nowo_tiptap_editor_asset_package', $fns[1]->getName());
    }

    public function testAssetPathReturnsRelativeFilename(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();

        self::assertSame('tiptap-editor.js', $ext->assetPath('tiptap-editor.js'));
        self::assertSame('tiptap-editor.js', $ext->assetPath('/tiptap-editor.js'));
    }

    public function testAssetPathRejectsPathTraversal(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        self::assertSame('tiptap-editor.js', $ext->assetPath('../other/file.js'));
    }

    public function testAssetPathRejectsInvalidCharacters(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        self::assertSame('tiptap-editor.js', $ext->assetPath('bad<script>.js'));
        self::assertSame('tiptap-editor.js', $ext->assetPath(''));
    }

    public function testAssetPathAllowsSubpath(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        self::assertSame('css/theme.css', $ext->assetPath('css/theme.css'));
    }
}
