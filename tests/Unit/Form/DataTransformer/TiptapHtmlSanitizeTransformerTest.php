<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Form\DataTransformer;

use Nowo\TiptapEditorBundle\Form\DataTransformer\TiptapHtmlSanitizeTransformer;
use Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer;
use Nowo\TiptapEditorBundle\Security\TiptapHtmlSanitizerInterface;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Nowo\TiptapEditorBundle\Form\DataTransformer\TiptapHtmlSanitizeTransformer
 */
final class TiptapHtmlSanitizeTransformerTest extends TestCase
{
    public function testTransformIsIdentity(): void
    {
        $transformer = new TiptapHtmlSanitizeTransformer(new AllowlistTiptapHtmlSanitizer());

        self::assertSame('<p>x</p>', $transformer->transform('<p>x</p>'));
        self::assertNull($transformer->transform(null));
    }

    public function testReverseTransformSanitizesStrings(): void
    {
        $transformer = new TiptapHtmlSanitizeTransformer(new AllowlistTiptapHtmlSanitizer());
        $result      = $transformer->reverseTransform('<p>Hi</p><script>alert(1)</script>');

        self::assertIsString($result);
        self::assertStringNotContainsString('script', $result);
        self::assertStringContainsString('<p>Hi</p>', $result);
    }

    public function testReverseTransformLeavesNonStrings(): void
    {
        $sanitizer = $this->createMock(TiptapHtmlSanitizerInterface::class);
        $sanitizer->expects(self::never())->method('sanitize');
        $transformer = new TiptapHtmlSanitizeTransformer($sanitizer);

        self::assertNull($transformer->reverseTransform(null));
        self::assertSame(123, $transformer->reverseTransform(123));
    }
}
