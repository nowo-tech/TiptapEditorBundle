<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Integration\Worker;

use Nowo\TiptapEditorBundle\Tests\Kernel\WorkerKeptAliveKernel;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\TerminableInterface;

use function gc_collect_cycles;
use function html_entity_decode;
use function http_build_query;
use function memory_get_usage;
use function sprintf;
use function str_contains;

use const ENT_HTML5;
use const ENT_QUOTES;

/**
 * REQ-RUNTIME-002: ONE kernel, `services_resetter` / `kernel.reset` never called (FrankenPHP worker, kernel reset
 * false). N iterations alternate two users (own locale, own upload hook, own body): a host form with the Tiptap field is
 * built, submitted and rendered through `http_kernel` handle() + terminate(). Each response must carry only its own
 * data and memory must stay flat.
 */
final class WorkerKeptAliveKernelTest extends TestCase
{
    private const ITERATIONS = 1200;
    private const WARM_UP    = 100;
    private const MARGIN     = 4 * 1024 * 1024;

    public function testAlternatingUsersInOneKernelLeakNothingAndKeepMemoryFlat(): void
    {
        $kernel = new WorkerKeptAliveKernel('test', false);
        $kernel->boot();

        try {
            $httpKernel = $kernel->getContainer()->get('http_kernel');
            self::assertInstanceOf(HttpKernelInterface::class, $httpKernel);
            self::assertInstanceOf(TerminableInterface::class, $httpKernel);

            $users = [
                'alpha' => ['locale' => 'en', 'upload' => '/upload/alpha', 'token' => 'tok-alpha-111', 'text' => 'alpha-secret-text', 'other' => ['beta-secret-text', '/upload/beta', 'tok-beta-222']],
                'beta'  => ['locale' => 'es', 'upload' => '/upload/beta', 'token' => 'tok-beta-222', 'text' => 'beta-secret-text', 'other' => ['alpha-secret-text', '/upload/alpha', 'tok-alpha-111']],
            ];

            $baseline = 0;
            $prompt   = [];
            for ($i = 0; $i < self::ITERATIONS; ++$i) {
                if ($i === self::WARM_UP) {
                    gc_collect_cycles();
                    $baseline = memory_get_usage();
                }

                $who  = $i % 2 === 0 ? 'alpha' : 'beta';
                $user = $users[$who];
                $uri  = '/' . $user['locale'] . '/edit?' . http_build_query(['u' => $user['upload'], 't' => $user['token']]);

                $get      = Request::create($uri, 'GET');
                $response = $httpKernel->handle($get);
                self::assertSame(200, $response->getStatusCode(), sprintf('iteration %d', $i));
                $httpKernel->terminate($get, $response);
                $html = html_entity_decode((string) $response->getContent(), ENT_QUOTES | ENT_HTML5);
                self::assertStringContainsString('data-tiptap-root="1"', $html, sprintf('iteration %d', $i));
                self::assertStringContainsString('data-tiptap-upload-url-value="' . $user['upload'] . '"', $html, sprintf('iteration %d', $i));
                self::assertStringContainsString('data-tiptap-upload-token-value="' . $user['token'] . '"', $html, sprintf('iteration %d', $i));
                $this->assertNoneOf($user['other'], $html, $i);
                self::assertSame(1, preg_match('/data-tiptap-prompt-link-url-value="([^"]*)"/', $html, $m), sprintf('iteration %d', $i));
                $prompt[$who] ??= $m[1];
                self::assertSame($prompt[$who], $m[1], sprintf('iteration %d: translated label changed (locale carried over)', $i));
                self::assertStringContainsString('@' . $user['locale'] . ']', $m[1], sprintf('iteration %d', $i));

                $post     = Request::create($uri, 'POST', ['host' => ['body' => $user['text']]]);
                $response = $httpKernel->handle($post);
                self::assertSame(200, $response->getStatusCode(), sprintf('iteration %d', $i));
                $httpKernel->terminate($post, $response);
                $html = html_entity_decode((string) $response->getContent(), ENT_QUOTES | ENT_HTML5);
                self::assertStringStartsWith('saved:' . $user['text'] . "\n", $html, sprintf('iteration %d', $i));
                $this->assertNoneOf($user['other'], $html, $i);
            }

            self::assertNotSame($prompt['alpha'], $prompt['beta'], 'both locales must render their own translation');

            gc_collect_cycles();
            $growth = memory_get_usage() - $baseline;
            self::assertLessThan(self::MARGIN, $growth, sprintf('memory grew by %d bytes over %d iterations', $growth, self::ITERATIONS - self::WARM_UP));
        } finally {
            $kernel->shutdown();
        }
    }

    /**
     * @param list<string> $needles
     */
    private function assertNoneOf(array $needles, string $html, int $iteration): void
    {
        foreach ($needles as $needle) {
            self::assertFalse(str_contains($html, $needle), sprintf('iteration %d: other user data "%s" in output', $iteration, $needle));
        }
    }
}
