<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Form;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * @covers \Nowo\TiptapEditorBundle\Form\TiptapEditorType
 */
final class TiptapEditorTypeTest extends TestCase
{
    /**
     * @return array<string, array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string}>
     */
    private function sampleConfigs(bool $toolbar = true, string $minHeight = '240px', bool $debug = false): array
    {
        return [
            'default' => [
                'toolbar'    => $toolbar,
                'min_height' => $minHeight,
                'form_theme' => 'form_div_layout.html.twig',
                'debug'      => $debug,
                'variant'    => 'default',
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
}
