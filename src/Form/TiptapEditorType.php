<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Form;

use Nowo\TiptapEditorBundle\EditorVariant;
use Nowo\TiptapEditorBundle\TiptapExample;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\Exception\InvalidOptionsException;
use Symfony\Component\OptionsResolver\Options;
use Symfony\Component\OptionsResolver\OptionsResolver;

use function in_array;
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
    /**
     * @param array<string, array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string}> $profiles
     */
    public function __construct(
        private readonly array $profiles,
        private readonly string $defaultProfileName,
    ) {
    }

    public function buildView(FormView $view, FormInterface $form, array $options): void
    {
        $name                                 = $options['config'] ?? $this->defaultProfileName;
        $view->vars['tiptap_toolbar']         = $options['toolbar'];
        $view->vars['tiptap_min_height']      = $options['min_height'];
        $view->vars['tiptap_placeholder_key'] = $options['placeholder'];
        $view->vars['tiptap_debug']           = $this->profiles[$name]['debug'];
        $view->vars['tiptap_variant']         = EditorVariant::fromString($this->profiles[$name]['variant'])->value;
        $view->vars['tiptap_example']         = $options['example'] instanceof TiptapExample ? $options['example']->value : null;
        $view->vars['tiptap_theme']           = $options['theme'];
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'config'             => null,
            'example'            => null,
            'placeholder'        => 'tiptap_placeholder',
            'attr'               => ['rows' => 10, 'cols' => 80],
            'translation_domain' => 'NowoTiptapEditorBundle',
            'required'           => false,
            'empty_data'         => '',
        ]);

        $resolver->setDefault('toolbar', fn (Options $options): bool => $this->profileFor($options)['toolbar']);
        $resolver->setDefault('min_height', fn (Options $options): string => $this->profileFor($options)['min_height']);
        $resolver->setDefault('theme', fn (Options $options): string => $this->normalizeTheme($this->profileFor($options)['theme'] ?? 'light'));

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
     * @return array{toolbar: bool, min_height: string, form_theme: string, debug: bool, variant: string, theme?: string}
     */
    private function profileFor(Options $options): array
    {
        $name = $options['config'] ?? $this->defaultProfileName;
        if (!isset($this->profiles[$name])) {
            throw new InvalidOptionsException(sprintf('Unknown Tiptap config profile "%s". Available profiles: %s.', $name, implode(', ', array_keys($this->profiles))));
        }

        return $this->profiles[$name];
    }

    public function getParent(): string
    {
        return TextareaType::class;
    }

    public function getBlockPrefix(): string
    {
        return 'tiptap_editor';
    }
}
