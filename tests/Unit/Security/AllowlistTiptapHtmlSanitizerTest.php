<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Security;

use Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer;
use PHPUnit\Framework\Attributes\DataProvider;
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

    public function testKeepsCommonBlockAndInlineMarkup(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();
        $html      = '<figure><img src="/x.png"><figcaption>Cap</figcaption></figure><h5>H</h5><p>a<sub>2</sub><sup>3</sup><mark>m</mark></p>';
        $result    = $sanitizer->sanitize($html);

        self::assertStringContainsString('<figure>', $result);
        self::assertStringContainsString('<figcaption>', $result);
        self::assertStringContainsString('<h5>', $result);
        self::assertStringContainsString('<sub>', $result);
        self::assertStringContainsString('<sup>', $result);
        self::assertStringContainsString('<mark>', $result);
    }

    /**
     * Regression payloads that bypassed the former regex/strip_tags implementation.
     *
     * @return iterable<string, array{0: string, 1: list<string>}>
     */
    public static function xssPayloadProvider(): iterable
    {
        yield 'unquoted event handler' => ['<img src=x onerror=alert(1)>', ['onerror', 'alert']];
        yield 'unquoted javascript href' => ['<a href=javascript:alert(1)>x</a>', ['javascript', 'alert']];
        yield 'entity-encoded javascript href' => ['<a href="&#106;avascript:alert(1)">x</a>', ['avascript', 'alert']];
        yield 'hex-entity javascript href' => ['<a href="&#x6A;avascript&#x3A;alert(1)">x</a>', ['avascript', 'alert']];
        yield 'javascript img src' => ['<img src="javascript:alert(1)">', ['javascript', 'alert']];
        yield 'style attribute' => ['<p style="background:url(javascript:alert(1))">x</p>', ['style', 'javascript']];
        yield 'iframe srcdoc on allowed host' => ['<iframe src="https://www.youtube.com/embed/x" srcdoc="<script>alert(1)</script>"></iframe>', ['srcdoc', 'script', 'alert']];
        yield 'unclosed iframe' => ['<iframe src="https://evil.example">', ['iframe', 'evil.example']];
        yield 'unquoted iframe src' => ['<iframe src=https://evil.example/x></iframe>', ['iframe', 'evil.example']];
        yield 'javascript iframe src' => ['<iframe src="javascript:alert(1)"></iframe>', ['iframe', 'alert']];
        yield 'http iframe on allowed host' => ['<iframe src="http://www.youtube.com/embed/x"></iframe>', ['iframe']];
        yield 'userinfo iframe host trick' => ['<iframe src="https://www.youtube.com@evil.example/x"></iframe>', ['iframe', 'evil.example']];
        yield 'svg onload' => ['<svg onload=alert(1)></svg>', ['svg', 'onload', 'alert']];
        yield 'mixed-case handler' => ['<div OnMouseOver=alert(1)>x</div>', ['onmouseover', 'alert']];
    }

    /**
     * @param list<string> $forbidden
     */
    #[DataProvider('xssPayloadProvider')]
    public function testRemovesXssPayload(string $payload, array $forbidden): void
    {
        $result = strtolower((new AllowlistTiptapHtmlSanitizer())->sanitize($payload));

        foreach ($forbidden as $needle) {
            self::assertStringNotContainsString(strtolower($needle), $result);
        }
    }

    public function testKeepsAllowedIframeWithoutSrcdocOrHandlers(): void
    {
        $result = (new AllowlistTiptapHtmlSanitizer())->sanitize(
            '<iframe src="https://player.vimeo.com/video/1" srcdoc="x" style="x" onload="x" width="100%" height="360" allowfullscreen="allowfullscreen" frameborder="0"></iframe>',
        );

        self::assertSame('<iframe src="https://player.vimeo.com/video/1" width="100%" height="360" allowfullscreen="allowfullscreen" frameborder="0"></iframe>', $result);
    }

    public function testCustomEmbedHostAllowlist(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer(['Embed.Example.com']);

        self::assertStringContainsString('<iframe', $sanitizer->sanitize('<iframe src="https://embed.example.com/v"></iframe>'));
        self::assertStringNotContainsString('<iframe', $sanitizer->sanitize('<iframe src="https://www.youtube.com/embed/x"></iframe>'));
    }

    public function testKeepsSafeLinksAndImages(): void
    {
        $result = (new AllowlistTiptapHtmlSanitizer())->sanitize(
            '<p><a href="https://example.com" target="_blank" rel="noopener">a</a><a href="mailto:a@example.com">m</a><a href="/rel">r</a><img src="https://example.com/i.png" alt="i"></p>',
        );

        self::assertStringContainsString('href="https://example.com"', $result);
        self::assertStringContainsString('href="mailto:a&#64;example.com"', $result);
        self::assertStringContainsString('href="/rel"', $result);
        self::assertStringContainsString('src="https://example.com/i.png"', $result);
    }

    public function testKeepsOnlyTextAlignStyle(): void
    {
        $sanitizer = new AllowlistTiptapHtmlSanitizer();

        self::assertSame('<p style="text-align: center">c</p>', $sanitizer->sanitize('<p style="TEXT-ALIGN: Center;">c</p>'));
        self::assertSame('<p>c</p>', $sanitizer->sanitize('<p style="text-align: center; color: red">c</p>'));
    }

    public function testKeepsTaskListDataAttributesAndUnwrapsUnknownWrappers(): void
    {
        $result = (new AllowlistTiptapHtmlSanitizer())->sanitize(
            '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label>done</label></li></ul><section>text</section>',
        );

        self::assertSame('<ul data-type="taskList"><li data-type="taskItem" data-checked="true">done</li></ul>text', $result);
    }
}
