<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\DependencyInjection;

use Nowo\TiptapEditorBundle\DependencyInjection\Configuration;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;
use Symfony\Component\Config\Definition\Processor;

/**
 * @covers \Nowo\TiptapEditorBundle\DependencyInjection\Configuration
 */
final class ConfigurationTest extends TestCase
{
    public function testDefaultConfiguration(): void
    {
        $processor = new Processor();
        // Processor expects at least one merged config chunk — same as Symfony Kernel (`[[]]`, not `[]`).
        $config = $processor->processConfiguration(new Configuration(), [[]]);

        self::assertSame('default', $config['default_profile']);
        $profile = $config['profiles']['default'];
        self::assertTrue($profile['toolbar']);
        self::assertSame('240px', $profile['min_height']);
        self::assertSame('form_div_layout.html.twig', $profile['form_theme']);
        self::assertFalse($profile['debug']);
        self::assertSame('default', $profile['variant']);
        self::assertSame('light', $profile['theme']);
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

        $profile = $config['profiles']['default'];
        self::assertFalse($profile['toolbar']);
        self::assertSame('320px', $profile['min_height']);
        self::assertSame('bootstrap_5_layout.html.twig', $profile['form_theme']);
        self::assertTrue($profile['debug']);
    }

    public function testExplicitProfilesWithoutFlatNormalization(): void
    {
        $processor = new Processor();
        $config    = $processor->processConfiguration(new Configuration(), [[
            'default_profile' => 'full',
            'profiles'        => [
                'full' => [
                    'toolbar'    => true,
                    'min_height' => '400px',
                    'form_theme' => 'bootstrap_5_layout.html.twig',
                    'debug'      => true,
                    'variant'    => 'agent',
                    'theme'      => 'dark',
                ],
            ],
        ]]);

        self::assertSame('full', $config['default_profile']);
        self::assertSame('agent', $config['profiles']['full']['variant']);
        self::assertSame('dark', $config['profiles']['full']['theme']);
    }

    public function testLegacyConfigsKeysAreMapped(): void
    {
        $processor = new Processor();
        $config    = $processor->processConfiguration(new Configuration(), [[
            'default_config' => 'full',
            'configs'        => [
                'full' => [
                    'variant' => 'agent',
                    'theme'   => 'dark',
                ],
            ],
        ]]);

        self::assertSame('full', $config['default_profile']);
        self::assertSame('agent', $config['profiles']['full']['variant']);
        self::assertArrayNotHasKey('default_config', $config);
        self::assertArrayNotHasKey('configs', $config);
    }

    public function testInvalidVariantThrows(): void
    {
        $this->expectException(InvalidConfigurationException::class);

        $processor = new Processor();
        $processor->processConfiguration(new Configuration(), [[
            'profiles' => [
                'default' => [
                    'variant' => 'invalid-variant-name',
                ],
            ],
        ]]);
    }

    public function testInvalidThemeThrows(): void
    {
        $this->expectException(InvalidConfigurationException::class);

        $processor = new Processor();
        $processor->processConfiguration(new Configuration(), [[
            'profiles' => [
                'default' => [
                    'theme' => 'sepia',
                ],
            ],
        ]]);
    }

    public function testDefaultProfileMustReferenceExistingProfile(): void
    {
        $this->expectException(InvalidConfigurationException::class);
        $this->expectExceptionMessage('must exist in nowo_tiptap_editor.profiles');

        $processor = new Processor();
        $processor->processConfiguration(new Configuration(), [[
            'default_profile' => 'missing_profile',
            'profiles'        => [
                'default' => [],
            ],
        ]]);
    }

    public function testMergedScalarChunkNormalizesThroughEarlyReturn(): void
    {
        $this->expectException(InvalidConfigurationException::class);

        $processor = new Processor();
        // Simulates an invalid merge shape; beforeNormalization returns the scalar unchanged.
        $processor->processConfiguration(new Configuration(), [true]);
    }
}
