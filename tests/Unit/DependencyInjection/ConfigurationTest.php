<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\DependencyInjection;

use Nowo\TiptapEditorBundle\DependencyInjection\Configuration;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\Processor;

/**
 * @covers \Nowo\TiptapEditorBundle\DependencyInjection\Configuration
 */
final class ConfigurationTest extends TestCase
{
    public function testDefaultConfiguration(): void
    {
        $processor = new Processor();
        $config    = $processor->processConfiguration(new Configuration(), []);

        self::assertTrue($config['toolbar']);
        self::assertSame('240px', $config['min_height']);
        self::assertSame('form_div_layout.html.twig', $config['form_theme']);
        self::assertFalse($config['debug']);
    }

    public function testCustomConfiguration(): void
    {
        $processor = new Processor();
        $config    = $processor->processConfiguration(new Configuration(), [[
            'toolbar'    => false,
            'min_height' => '320px',
            'form_theme' => 'bootstrap_5_layout.html.twig',
            'debug'      => true,
        ]]);

        self::assertFalse($config['toolbar']);
        self::assertSame('320px', $config['min_height']);
        self::assertSame('bootstrap_5_layout.html.twig', $config['form_theme']);
        self::assertTrue($config['debug']);
    }
}
