<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Security;

use Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer
 */
final class AllowlistTiptapHtmlSanitizerTest extends TestCase
{
    public function testStripsScriptTags(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $result    = $sanitizer->sanitize('<p>Hi</p><script>alert(1)</script>');

        self::assertStringNotContainsString('script', $result);
        self::assertStringContainsString('<p>Hi</p>', $result);
    }
}
