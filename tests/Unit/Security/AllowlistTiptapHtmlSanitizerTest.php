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

    public function testStripsInlineEventHandlers(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $result    = $sanitizer->sanitize('<p onclick="alert(1)">Hi</p>');

        self::assertStringNotContainsString('onclick', $result);
        self::assertStringContainsString('<p>Hi</p>', $result);
    }

    public function testStripsJavascriptHref(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $result    = $sanitizer->sanitize('<a href="javascript:alert(1)">x</a>');

        self::assertStringNotContainsString('javascript:', $result);
    }

    public function testKeepsAllowedYoutubeIframe(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $iframe    = '<iframe src="https://www.youtube.com/embed/abc"></iframe>';
        $result    = $sanitizer->sanitize('<p>v</p>' . $iframe);

        self::assertStringContainsString('youtube.com', $result);
        self::assertStringContainsString('<iframe', $result);
    }

    public function testStripsDisallowedIframeHost(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $result    = $sanitizer->sanitize('<iframe src="https://evil.example/embed"></iframe>');

        self::assertStringNotContainsString('iframe', $result);
        self::assertStringNotContainsString('evil.example', $result);
    }

    public function testStripsIframeWithoutSrc(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $result    = $sanitizer->sanitize('<iframe></iframe><p>ok</p>');

        self::assertStringNotContainsString('iframe', $result);
        self::assertStringContainsString('<p>ok</p>', $result);
    }
}
