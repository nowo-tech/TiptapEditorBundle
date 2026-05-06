<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Form;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\TiptapExample;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\Exception\InvalidOptionsException;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * @covers \Nowo\TiptapEditorBundle\Form\TiptapEditorType
 */
final class TiptapEditorTypeTest extends TestCase
{
    /**
     * @return array<string, array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string}>
     */
    private function sampleConfigs(bool $toolbar = true, string $minHeight = '240px', bool $debug = false, ?string $profileTheme = null): array
    {
        $profile = [
            'toolbar'    => $toolbar,
            'min_height' => $minHeight,
            'form_theme' => 'form_div_layout.html.twig',
            'debug'      => $debug,
            'variant'    => 'default',
        ];
        if ($profileTheme !== null) {
            $profile['theme'] = $profileTheme;
        }

        return ['default' => $profile];
    }

    /**
     * @return array<string, array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string}>
     */
    private function sampleConfigsTwoProfiles(): array
    {
        return [
            'default' => [
                'toolbar'    => true,
                'min_height' => '240px',
                'form_theme' => 'form_div_layout.html.twig',
                'debug'      => false,
                'variant'    => 'default',
                'theme'      => 'light',
            ],
            'full' => [
                'toolbar'    => false,
                'min_height' => '480px',
                'form_theme' => 'form_div_layout.html.twig',
                'debug'      => true,
                'variant'    => 'notion',
                'theme'      => 'auto',
            ],
        ];
    }

    private function createType(bool $toolbar = true, string $minHeight = '240px', bool $debug = false): TiptapEditorType
    {
        return new TiptapEditorType($this->sampleConfigs($toolbar, $minHeight, $debug), 'default');
    }

    public function testDefaultOptions(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve([]);

        self::assertTrue($options['toolbar']);
        self::assertSame('240px', $options['min_height']);
        self::assertSame('tiptap_placeholder', $options['placeholder']);
        self::assertSame('NowoTiptapEditorBundle', $options['translation_domain']);
        self::assertFalse($options['required']);
    }

    public function testResolveWithToolbarFalse(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve(['toolbar' => false]);

        self::assertFalse($options['toolbar']);
    }

    public function testGetParent(): void
    {
        $type = $this->createType();
        self::assertSame(TextareaType::class, $type->getParent());
    }

    public function testGetBlockPrefix(): void
    {
        $type = $this->createType();
        self::assertSame('tiptap_editor', $type->getBlockPrefix());
    }

    public function testBuildViewSetsVars(): void
    {
        $type = $this->createType(true, '300px', true);
        $view = new FormView();
        $form = $this->createStub(FormInterface::class);

        $type->buildView($view, $form, [
            'toolbar'            => false,
            'min_height'         => '300px',
            'placeholder'        => 'custom_ph',
            'attr'               => [],
            'translation_domain' => 'messages',
            'required'           => false,
            'empty_data'         => '',
            'config'             => null,
            'example'            => null,
            'theme'              => 'light',
        ]);

        self::assertFalse($view->vars['tiptap_toolbar']);
        self::assertSame('300px', $view->vars['tiptap_min_height']);
        self::assertSame('custom_ph', $view->vars['tiptap_placeholder_key']);
        self::assertTrue($view->vars['tiptap_debug']);
    }

    public function testConstructorDefaultsPassedToOptions(): void
    {
        $type     = new TiptapEditorType($this->sampleConfigs(false, '120px', false), 'default');
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve([]);

        self::assertFalse($options['toolbar']);
        self::assertSame('120px', $options['min_height']);
    }

    public function testResolveUsesProfileThemeFromYaml(): void
    {
        $type     = new TiptapEditorType($this->sampleConfigs(true, '240px', false, 'dark'), 'default');
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve([]);

        self::assertSame('dark', $options['theme']);
    }

    public function testResolveThemeOptionOverridesWithNormalization(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve(['theme' => 'purple']);

        self::assertSame('light', $options['theme']);
    }

    public function testResolveWithNamedConfigProfile(): void
    {
        $type     = new TiptapEditorType($this->sampleConfigsTwoProfiles(), 'default');
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve(['config' => 'full']);

        self::assertSame('full', $options['config']);
        self::assertFalse($options['toolbar']);
        self::assertSame('480px', $options['min_height']);
        self::assertSame('auto', $options['theme']);
    }

    public function testResolveExampleAsString(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve(['example' => 'tables']);

        self::assertSame(TiptapExample::Tables, $options['example']);
    }

    public function testResolveExampleEnumInstance(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);
        $options = $resolver->resolve(['example' => TiptapExample::Menus]);

        self::assertSame(TiptapExample::Menus, $options['example']);
    }

    public function testResolveExampleUnknownStringThrows(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);

        $this->expectException(InvalidOptionsException::class);
        $this->expectExceptionMessage('Unknown Tiptap example');

        $resolver->resolve(['example' => 'no_such_recipe']);
    }

    public function testResolveUnknownConfigProfileThrows(): void
    {
        $type     = $this->createType();
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);

        $this->expectException(InvalidOptionsException::class);
        $this->expectExceptionMessage('Unknown Tiptap config profile');

        $resolver->resolve(['config' => 'missing']);
    }

    public function testResolveFailsWhenDefaultProfileKeyMissing(): void
    {
        $type = new TiptapEditorType([
            'other' => [
                'toolbar'    => true,
                'min_height' => '10px',
                'form_theme' => 'form_div_layout.html.twig',
                'debug'      => false,
                'variant'    => 'default',
            ],
        ], 'default');

        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);

        $this->expectException(InvalidOptionsException::class);
        $this->expectExceptionMessage('Unknown Tiptap config profile');

        $resolver->resolve([]);
    }

    public function testBuildViewSetsExampleAndVariantFromProfile(): void
    {
        $type = new TiptapEditorType([
            'default' => [
                'toolbar'    => true,
                'min_height' => '240px',
                'form_theme' => 'form_div_layout.html.twig',
                'debug'      => false,
                'variant'    => 'notion',
            ],
        ], 'default');

        $view = new FormView();
        $form = $this->createStub(FormInterface::class);

        $type->buildView($view, $form, [
            'toolbar'            => true,
            'min_height'         => '240px',
            'placeholder'        => false,
            'attr'               => [],
            'translation_domain' => 'messages',
            'required'           => false,
            'empty_data'         => '',
            'config'             => null,
            'example'            => TiptapExample::Tables,
            'theme'              => 'dark',
        ]);

        self::assertSame('notion', $view->vars['tiptap_variant']);
        self::assertSame('tables', $view->vars['tiptap_example']);
        self::assertSame('dark', $view->vars['tiptap_theme']);
        self::assertFalse($view->vars['tiptap_placeholder_key']);
    }

    public function testNormalizeThemePrivate(): void
    {
        $type = $this->createType();
        $m    = new ReflectionMethod(TiptapEditorType::class, 'normalizeTheme');

        self::assertSame('light', $m->invoke($type, 'invalid-theme'));
        self::assertSame('auto', $m->invoke($type, ' AuTo '));
    }
}
