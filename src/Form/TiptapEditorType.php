<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Form;

use Nowo\TiptapEditorBundle\EditorVariant;
use Nowo\TiptapEditorBundle\Form\DataTransformer\TiptapHtmlSanitizeTransformer;
use Nowo\TiptapEditorBundle\Security\TiptapHtmlSanitizerInterface;
use Nowo\TiptapEditorBundle\TiptapExample;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\Exception\InvalidOptionsException;
use Symfony\Component\OptionsResolver\Options;
use Symfony\Component\OptionsResolver\OptionsResolver;

use function in_array;
use function is_array;
use function is_string;
use function sprintf;

/**
 * Rich-text field backed by a hidden textarea (HTML) and a Tiptap editor surface (see frontend bundle script).
 *
 * Use the `config` option to pick a named profile from `nowo_tiptap_editor.profiles`; omitted/null uses `default_profile`.
 * Use the `example` option to enable an extension “recipe” (tables, tasks, syntax highlighting, etc.); see {@see TiptapExample}.
 *
 * @extends AbstractType<string>
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class TiptapEditorType extends AbstractType
{
    /** Default `placeholder` option: a key of the NowoTiptapEditorBundle catalogue (translated in that domain). */
    public const DEFAULT_PLACEHOLDER = 'tiptap_placeholder';

    /** Translation domain of the bundle catalogue. */
    public const TRANSLATION_DOMAIN = 'NowoTiptapEditorBundle';

    /** Toolbar display modes (1.7): `text` = the 1.x glyphs, `icon` = SVG icons (or the host icon templates). */
    public const TOOLBAR_DISPLAYS = ['text', 'icon'];

    /**
     * Toolbar command ids (1.7): `tiptap_toolbar.<id>` labels the button (aria-label / title) and `<id>` names its icon;
     * `toolbar` labels the toolbar itself.
     */
    public const TOOLBAR_COMMANDS = [
        'toolbar', 'undo', 'redo', 'paragraph', 'heading_1', 'heading_2', 'heading_3', 'heading_4', 'heading_5', 'heading_6',
        'bold', 'italic', 'strike', 'code', 'underline', 'link', 'bullet_list', 'ordered_list', 'blockquote', 'code_block',
        'horizontal_rule', 'align_left', 'align_center', 'align_right', 'align_justify', 'hard_break', 'highlight',
        'subscript', 'superscript', 'table_insert', 'table_add_column', 'table_add_row', 'table_header_row', 'table_delete',
        'task_list', 'image',
    ];

    /**
     * @param array<string, array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string, toolbar_display?: string}> $profiles
     * @param bool $linkStylesheet whether the widget links tiptap-editor.css (1.7; nowo_tiptap_editor.stylesheet)
     */
    public function __construct(
        private readonly array $profiles,
        private readonly string $defaultProfileName,
        private readonly ?TiptapHtmlSanitizerInterface $htmlSanitizer = null,
        private readonly bool $linkStylesheet = true,
    ) {
    }

    /**
     * Adds the HTML sanitizing model transformer when a sanitizer is configured.
     *
     * @param FormBuilderInterface<mixed> $builder the form builder
     * @param array<string, mixed> $options resolved field options
     */
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        if ($this->htmlSanitizer instanceof TiptapHtmlSanitizerInterface) {
            $builder->addModelTransformer(new TiptapHtmlSanitizeTransformer($this->htmlSanitizer));
        }
    }

    /**
     * Exposes the resolved editor profile (variant, toolbar, theme, hooks, labels) to the form theme.
     *
     * @param FormView $view the field view
     * @param FormInterface<mixed> $form the field
     * @param array<string, mixed> $options resolved field options
     */
    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        $name                                 = $options['config'] ?? $this->defaultProfileName;
        $view->vars['tiptap_toolbar']         = $options['toolbar'];
        $view->vars['tiptap_min_height']      = $options['min_height'];
        $view->vars['tiptap_placeholder_key'] = $options['placeholder'];
        // 1.7: the bundle's default key lives in the bundle catalogue, whatever the field's translation_domain (a
        // parent form or a FormKit profile may set another one); a custom key is translated in the field's domain.
        $view->vars['tiptap_placeholder_domain'] = $options['placeholder'] === self::DEFAULT_PLACEHOLDER ? self::TRANSLATION_DOMAIN : null;
        $view->vars['tiptap_toolbar_display']    = $options['toolbar_display'] ?? 'text';
        $view->vars['tiptap_toolbar_commands']   = self::TOOLBAR_COMMANDS;
        $view->vars['tiptap_stylesheet']         = $this->linkStylesheet;
        $view->vars['tiptap_debug']              = $this->profiles[$name]['debug'];
        $view->vars['tiptap_variant']            = EditorVariant::fromString($this->profiles[$name]['variant'])->value;
        $view->vars['tiptap_example']            = $options['example'] instanceof TiptapExample ? $options['example']->value : null;
        $view->vars['tiptap_theme']              = $options['theme'];
        // 1.6: upload and suggestion hooks (rendered as data attributes; off when empty).
        $view->vars['tiptap_upload_url']        = $options['upload_url'];
        $view->vars['tiptap_upload_csrf_token'] = $options['upload_csrf_token'];
        $view->vars['tiptap_suggestions']       = $options['suggestions'];
    }

    /**
     * Declares the editor options (profile, variant, toolbar, toolbar display, theme, placeholder, upload and suggestion
     * hooks).
     *
     * @param OptionsResolver $resolver the options resolver
     */
    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'config'             => null,
            'example'            => null,
            'placeholder'        => self::DEFAULT_PLACEHOLDER,
            'attr'               => ['rows' => 10, 'cols' => 80],
            'translation_domain' => self::TRANSLATION_DOMAIN,
            'required'           => false,
            'empty_data'         => '',
            // 1.6: POST target of dropped / pasted files (JSON answer {url, name, image}); null = no upload hook.
            'upload_url' => null,
            // 1.6: value sent as the X-CSRF-Token header of the uploads.
            'upload_csrf_token' => null,
            // 1.6: suggestion triggers, e.g. [{trigger: '@', url: '/mentions'}, {trigger: '#doc', url: '/pages'}].
            'suggestions' => [],
        ]);
        $resolver->setAllowedTypes('upload_url', ['null', 'string']);
        $resolver->setAllowedTypes('upload_csrf_token', ['null', 'string']);
        $resolver->setAllowedTypes('suggestions', 'array');
        $resolver->setNormalizer('suggestions', static function (Options $options, array $value): array {
            $triggers = [];
            foreach ($value as $item) {
                if (!is_array($item) || !is_string($item['trigger'] ?? null) || $item['trigger'] === '' || !is_string($item['url'] ?? null)) {
                    throw new InvalidOptionsException('Each Tiptap suggestion needs a non-empty "trigger" and a "url".');
                }

                $triggers[] = ['trigger' => $item['trigger'], 'url' => $item['url']];
            }

            return $triggers;
        });

        $resolver->setDefault('toolbar', fn (Options $options): bool => $this->profileFor($options)['toolbar']);
        $resolver->setDefault('min_height', fn (Options $options): string => $this->profileFor($options)['min_height']);
        $resolver->setDefault('theme', fn (Options $options): string => $this->normalizeTheme($this->profileFor($options)['theme'] ?? 'light'));
        // 1.7: text (1.x glyphs) or icon toolbar buttons; default from the profile.
        $resolver->setDefault('toolbar_display', fn (Options $options): string => $this->profileFor($options)['toolbar_display'] ?? 'text');
        $resolver->setAllowedValues('toolbar_display', self::TOOLBAR_DISPLAYS);

        $resolver->setAllowedTypes('config', ['null', 'string']);
        $resolver->setAllowedTypes('toolbar', ['bool']);
        $resolver->setAllowedTypes('min_height', ['string']);
        $resolver->setAllowedTypes('placeholder', ['null', 'string', 'bool']);
        $resolver->setAllowedTypes('example', ['null', 'string', TiptapExample::class]);
        $resolver->setAllowedTypes('theme', ['string']);

        $resolver->setNormalizer('theme', fn (Options $options, string $value): string => $this->normalizeTheme($value));

        $resolver->setNormalizer('example', static function (Options $options, mixed $value): ?TiptapExample {
            if ($value === null || $value === '') {
                return null;
            }
            if ($value instanceof TiptapExample) {
                return $value;
            }

            $ex = TiptapExample::tryFrom((string) $value);
            if ($ex === null) {
                throw new InvalidOptionsException(sprintf('Unknown Tiptap example "%s". Allowed: %s.', $value, implode(', ', TiptapExample::values())));
            }

            return $ex;
        });

        $resolver->setNormalizer('config', function (Options $options, mixed $value): ?string {
            if ($value === null || $value === '') {
                return null;
            }
            if (!isset($this->profiles[$value])) {
                throw new InvalidOptionsException(sprintf('Unknown Tiptap config profile "%s". Available profiles: %s.', $value, implode(', ', array_keys($this->profiles))));
            }

            return $value;
        });
    }

    private function normalizeTheme(string $value): string
    {
        $t = strtolower(trim($value));

        return in_array($t, ['light', 'dark', 'auto'], true) ? $t : 'light';
    }

    /**
     * @param Options<array<string, mixed>> $options
     *
     * @return array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string, toolbar_display?: string}
     */
    private function profileFor(Options $options): array
    {
        $name = $options['config'] ?? $this->defaultProfileName;
        if (!isset($this->profiles[$name])) {
            throw new InvalidOptionsException(sprintf('Unknown Tiptap config profile "%s". Available profiles: %s.', $name, implode(', ', array_keys($this->profiles))));
        }

        return $this->profiles[$name];
    }

    /**
     * The field renders as a textarea that the editor keeps in sync.
     *
     * @return string the parent type class
     */
    public function getParent(): string
    {
        return TextareaType::class;
    }

    /**
     * Block prefix used by the `tiptap_editor_*` form theme blocks.
     *
     * @return string the block prefix
     */
    public function getBlockPrefix(): string
    {
        return 'tiptap_editor';
    }
}
