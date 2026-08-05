<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\DependencyInjection;

use Nowo\TiptapEditorBundle\DependencyInjection\Configuration;
use Nowo\TiptapEditorBundle\DependencyInjection\NowoTiptapEditorExtension;
use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer;
use Nowo\TiptapEditorBundle\Security\TiptapHtmlSanitizerInterface;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use Symfony\Bundle\FrameworkBundle\DependencyInjection\FrameworkExtension;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Reference;

/**
 * @covers \Nowo\TiptapEditorBundle\DependencyInjection\NowoTiptapEditorExtension
 */
final class NowoTiptapEditorExtensionTest extends TestCase
{
    public function testGetAlias(): void
    {
        $extension = new NowoTiptapEditorExtension();
        self::assertSame(Configuration::ALIAS, $extension->getAlias());
    }

    public function testLoadRegistersParameters(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->load([[]], $container);

        self::assertTrue($container->hasParameter('nowo_tiptap_editor.default_profile'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.profiles'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.default_config'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.configs'));
        self::assertSame(
            $container->getParameter('nowo_tiptap_editor.default_profile'),
            $container->getParameter('nowo_tiptap_editor.default_config'),
        );
        self::assertSame(
            $container->getParameter('nowo_tiptap_editor.profiles'),
            $container->getParameter('nowo_tiptap_editor.configs'),
        );
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.toolbar'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.min_height'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.form_theme'));
        self::assertTrue($container->hasParameter('nowo_tiptap_editor.debug'));
    }

    public function testLoadWithCustomConfig(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->load([[
            'toolbar'    => false,
            'min_height' => '400px',
            'form_theme' => 'bootstrap_5_layout.html.twig',
            'debug'      => true,
        ]], $container);

        self::assertFalse($container->getParameter('nowo_tiptap_editor.toolbar'));
        self::assertSame('400px', $container->getParameter('nowo_tiptap_editor.min_height'));
        self::assertSame('bootstrap_5_layout.html.twig', $container->getParameter('nowo_tiptap_editor.form_theme'));
        self::assertTrue($container->getParameter('nowo_tiptap_editor.debug'));
    }

    public function testPrependAddsTwigFormTheme(): void
    {
        $twigExtension = new class extends Extension {
            public function load(array $configs, ContainerBuilder $container): void
            {
            }

            public function getAlias(): string
            {
                return 'twig';
            }
        };
        $container = new ContainerBuilder();
        $container->registerExtension($twigExtension);
        $container->loadFromExtension('twig', ['strict_variables' => false]);
        $container->registerExtension(new NowoTiptapEditorExtension());
        $container->loadFromExtension(Configuration::ALIAS, ['form_theme' => 'form_div_layout.html.twig']);

        $extension = new NowoTiptapEditorExtension();
        $extension->prepend($container);

        $twigConfig = $container->getExtensionConfig('twig');
        self::assertNotEmpty($twigConfig);
        $config = $twigConfig[0] ?? [];
        self::assertArrayHasKey('form_themes', $config);
    }

    public function testPrependUsesDefaultThemeWhenUnknown(): void
    {
        $twigExtension = new class extends Extension {
            public function load(array $configs, ContainerBuilder $container): void
            {
            }

            public function getAlias(): string
            {
                return 'twig';
            }
        };
        $container = new ContainerBuilder();
        $container->registerExtension($twigExtension);
        $container->loadFromExtension('twig', []);
        $container->registerExtension(new NowoTiptapEditorExtension());
        $container->loadFromExtension(Configuration::ALIAS, ['form_theme' => 'unknown_theme.html.twig']);

        $extension = new NowoTiptapEditorExtension();
        $extension->prepend($container);

        $twigConfig = $container->getExtensionConfig('twig');
        $config     = $twigConfig[0] ?? [];
        self::assertContains('@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig', $config['form_themes']);
    }

    public function testPrependSkipsWhenTwigNotLoaded(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->prepend($container);
        self::assertFalse($container->hasExtension('twig'));
    }

    public function testPrependConfiguresAssets(): void
    {
        $container = new ContainerBuilder();
        $container->registerExtension(new FrameworkExtension());
        (new NowoTiptapEditorExtension())->prepend($container);
        $configs = $container->getExtensionConfig('framework');
        self::assertSame('/bundles/nowotiptapeditor', $configs[0]['assets']['packages']['nowo_tiptap_editor']['base_path']);
    }

    public function testLoadWithHtmlSanitizerAllowlist(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->load([['html_sanitizer' => 'allowlist']], $container);

        $typeDefinition = $container->getDefinition(TiptapEditorType::class);
        $arg            = $typeDefinition->getArgument('$htmlSanitizer');
        self::assertInstanceOf(Reference::class, $arg);
        self::assertSame(TiptapHtmlSanitizerInterface::class, (string) $arg);
        self::assertTrue($container->hasAlias(TiptapHtmlSanitizerInterface::class));
        self::assertSame(AllowlistTiptapHtmlSanitizer::class, (string) $container->getAlias(TiptapHtmlSanitizerInterface::class));
    }

    public function testLoadWithHtmlSanitizerCustomService(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->load([['html_sanitizer' => 'app.custom_sanitizer']], $container);

        self::assertTrue($container->hasAlias(TiptapHtmlSanitizerInterface::class));
        self::assertSame('app.custom_sanitizer', (string) $container->getAlias(TiptapHtmlSanitizerInterface::class));
    }

    public function testLoadWithHtmlSanitizerEmptyDisables(): void
    {
        $container = new ContainerBuilder();
        $extension = new NowoTiptapEditorExtension();
        $extension->load([['html_sanitizer' => '']], $container);

        $typeDefinition = $container->getDefinition(TiptapEditorType::class);
        self::assertNull($typeDefinition->getArgument('$htmlSanitizer'));
    }

    public function testConfigureHtmlSanitizerRegistersAllowlistWhenMissing(): void
    {
        $container = new ContainerBuilder();
        $container->register(TiptapEditorType::class, TiptapEditorType::class)
            ->setAutowired(true)
            ->setAutoconfigured(true)
            ->addTag('form.type');

        $extension = new NowoTiptapEditorExtension();
        $method    = new ReflectionMethod(NowoTiptapEditorExtension::class, 'configureHtmlSanitizer');
        $method->setAccessible(true);
        $method->invoke($extension, $container, 'allowlist');

        self::assertTrue($container->hasDefinition(AllowlistTiptapHtmlSanitizer::class));
        self::assertTrue($container->hasAlias(TiptapHtmlSanitizerInterface::class));
    }
}
