<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Form;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Bridge\Twig\Extension\AssetExtension;
use Symfony\Bridge\Twig\Extension\FormExtension;
use Symfony\Bridge\Twig\Extension\TranslationExtension;
use Symfony\Bridge\Twig\Form\TwigRendererEngine;
use Symfony\Component\Asset\Packages;
use Symfony\Component\Asset\PathPackage;
use Symfony\Component\Asset\VersionStrategy\EmptyVersionStrategy;
use Symfony\Component\Form\Extension\Core\Type\FormType;
use Symfony\Component\Form\FormRenderer;
use Symfony\Component\Form\Forms;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Environment;
use Twig\Loader\ArrayLoader;
use Twig\Loader\ChainLoader;
use Twig\Loader\FilesystemLoader;
use Twig\RuntimeLoader\FactoryRuntimeLoader;

use function dirname;
use function html_entity_decode;
use function json_decode;
use function preg_match;

use const ENT_HTML5;
use const ENT_QUOTES;
use const JSON_THROW_ON_ERROR;

/**
 * Renders the real widget theme (1.7): no inline <style> / style attribute (strict CSP), the stylesheet link with the
 * request CSP nonce, the default placeholder in the bundle domain, the toolbar labels and the icon hook block.
 */
final class TiptapEditorThemeRenderingTest extends TestCase
{
    private const THEME = '@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig';

    public function testWidgetIsCspSafeAndLinksTheStylesheetWithTheNonce(): void
    {
        $html = $this->render(['placeholder' => 'tiptap_placeholder', 'toolbar_display' => 'icon'], nonce: 'n0nc3');

        self::assertStringNotContainsString('<style', $html);
        self::assertDoesNotMatchRegularExpression('/\sstyle="/', $html);
        self::assertStringContainsString('<link rel="stylesheet" href="/bundles/nowotiptapeditor/tiptap-editor.css" data-tiptap-stylesheet nonce="n0nc3">', $html);
        self::assertStringContainsString('hidden="hidden"', $html);
        // The default key is the bundle's, even when the parent form translates in another domain.
        self::assertStringContainsString('data-tiptap-placeholder-value="[NowoTiptapEditorBundle] tiptap_placeholder"', html_entity_decode($html, ENT_QUOTES | ENT_HTML5));
        self::assertStringContainsString('data-tiptap-toolbar-display-value="icon"', $html);

        $labels = $this->labels($html);
        self::assertSame('[NowoTiptapEditorBundle] tiptap_toolbar.bold', $labels['bold']);
        self::assertSame(TiptapEditorType::TOOLBAR_COMMANDS, array_keys($labels));
    }

    public function testCustomPlaceholderUsesTheFieldDomainAndNoNonceWithoutOne(): void
    {
        $html = $this->render(['placeholder' => 'app.body.placeholder']);

        self::assertStringContainsString('data-tiptap-placeholder-value="[AppDomain] app.body.placeholder"', html_entity_decode($html, ENT_QUOTES | ENT_HTML5));
        self::assertStringContainsString('<link rel="stylesheet" href="/bundles/nowotiptapeditor/tiptap-editor.css" data-tiptap-stylesheet>', $html);
        self::assertStringContainsString('data-tiptap-toolbar-display-value="text"', $html);
    }

    public function testStylesheetLinkCanBeTurnedOffAndTheDisplayModeNeedsAToolbar(): void
    {
        $html = $this->render(['toolbar' => false], linkStylesheet: false);

        self::assertStringNotContainsString('data-tiptap-stylesheet', $html);
        self::assertStringNotContainsString('data-tiptap-toolbar-display-value', $html);
        // The labels also name the Notion menu buttons (no toolbar).
        self::assertSame('[NowoTiptapEditorBundle] tiptap_toolbar.insert', $this->labels($html)['insert']);
        self::assertStringContainsString('data-tiptap-toolbar-value="0"', $html);
    }

    public function testHostThemeCanProvideTheToolbarIcons(): void
    {
        $hostTheme = <<<'TWIG'
            {% use '@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig' %}
            {% block tiptap_editor_toolbar_icons %}<template data-tiptap-icon="bold"><svg class="host-icon"></svg></template>{% endblock %}
            TWIG;

        $html = $this->render(['toolbar_display' => 'icon'], theme: 'host_theme.html.twig', templates: ['host_theme.html.twig' => $hostTheme]);

        self::assertMatchesRegularExpression('#<nowo-tiptap-editor[^>]*>.*<template data-tiptap-icon="bold"><svg class="host-icon"></svg></template>.*</nowo-tiptap-editor>#s', $html);
    }

    /**
     * @param array<string, mixed> $options TiptapEditorType options
     * @param array<string, string> $templates extra in-memory templates
     */
    private function render(array $options, ?string $nonce = null, bool $linkStylesheet = true, string $theme = self::THEME, array $templates = []): string
    {
        $profiles = ['default' => ['toolbar' => true, 'min_height' => '240px', 'form_theme' => 'form_div_layout.html.twig', 'debug' => false, 'variant' => 'notion']];

        $filesystem = new FilesystemLoader([dirname(__DIR__, 3) . '/vendor/symfony/twig-bridge/Resources/views/Form']);
        $filesystem->addPath(dirname(__DIR__, 3) . '/src/Resources/views', 'NowoTiptapEditorBundle');
        $twig = new Environment(new ChainLoader([new ArrayLoader($templates), $filesystem]), ['strict_variables' => true]);

        $stack   = new RequestStack();
        $request = new Request();
        if ($nonce !== null) {
            $request->attributes->set('csp_nonce', $nonce);
        }
        $stack->push($request);

        $twig->addExtension(new FormExtension());
        $twig->addExtension(new TranslationExtension(new class implements TranslatorInterface {
            /**
             * @param array<string, mixed> $parameters
             */
            public function trans(string $id, array $parameters = [], ?string $domain = null, ?string $locale = null): string
            {
                return '[' . ($domain ?? 'messages') . '] ' . $id;
            }

            public function getLocale(): string
            {
                return 'en';
            }
        }));
        $twig->addExtension(new AssetExtension(new Packages(null, [
            NowoTiptapEditorTwigExtension::ASSET_PACKAGE => new PathPackage('/bundles/' . NowoTiptapEditorTwigExtension::ASSET_DIR, new EmptyVersionStrategy()),
        ])));
        $twig->addExtension(new NowoTiptapEditorTwigExtension($stack));
        $engine = new TwigRendererEngine([$theme], $twig);
        $twig->addRuntimeLoader(new FactoryRuntimeLoader([FormRenderer::class => static fn (): FormRenderer => new FormRenderer($engine)]));

        $factory = Forms::createFormFactoryBuilder()
            ->addType(new TiptapEditorType($profiles, 'default', null, $linkStylesheet))
            ->getFormFactory();
        // The parent form (and a FormKit-like profile) translate in the host domain.
        $form = $factory->createNamedBuilder('page', FormType::class, null, ['translation_domain' => 'AppDomain'])
            ->add('content', TiptapEditorType::class, ['translation_domain' => 'AppDomain'] + $options)
            ->getForm();

        return $twig->createTemplate('{{ form_widget(form.content) }}')->render(['form' => $form->createView()]);
    }

    /**
     * @return array<string, string>
     */
    private function labels(string $html): array
    {
        self::assertSame(1, preg_match('/data-tiptap-toolbar-labels-value="([^"]*)"/', $html, $match));
        /** @var array<string, string> $labels */
        $labels = json_decode(html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5), true, flags: JSON_THROW_ON_ERROR);

        return $labels;
    }
}
