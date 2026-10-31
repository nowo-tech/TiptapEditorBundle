<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Twig;

use Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * @covers \Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension
 */
final class NowoTiptapEditorTwigExtensionTest extends TestCase
{
    public function testGetFunctionsReturnsAssetHelpers(): void
    {
        $ext = new NowoTiptapEditorTwigExtension();
        $fns = $ext->getFunctions();

        self::assertCount(3, $fns);
        self::assertSame('nowo_tiptap_editor_asset_path', $fns[0]->getName());
        self::assertSame('nowo_tiptap_editor_asset_package', $fns[1]->getName());
        self::assertSame('nowo_tiptap_editor_csp_nonce', $fns[2]->getName());
    }

    public function testCspNonceReadsTheCurrentRequestAttribute(): void
    {
        self::assertNull((new NowoTiptapEditorTwigExtension())->cspNonce());

        $stack = new RequestStack();
        $ext   = new NowoTiptapEditorTwigExtension($stack);
        self::assertNull($ext->cspNonce());

        $request = new Request();
        $stack->push($request);
        self::assertNull($ext->cspNonce());

        $request->attributes->set('csp_nonce', ['not-a-string']);
        self::assertNull($ext->cspNonce());
        $request->attributes->set('csp_nonce', '');
        self::assertNull($ext->cspNonce());
        $request->attributes->set('csp_nonce', 'r4nd0m');
        self::assertSame('r4nd0m', $ext->cspNonce());
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
