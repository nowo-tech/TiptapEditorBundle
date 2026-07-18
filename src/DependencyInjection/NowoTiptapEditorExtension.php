<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\DependencyInjection;

use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\Extension;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

/**
 * Loads services and prepends the bundle form theme(s) to Twig.
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class NowoTiptapEditorExtension extends Extension implements PrependExtensionInterface
{
    /** @var array<string, string> */
    private const FORM_THEME_MAP = [
        'form_div_layout.html.twig'               => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme.html.twig',
        'form_table_layout.html.twig'             => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_table.html.twig',
        'bootstrap_5_layout.html.twig'            => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap5.html.twig',
        'bootstrap_5_horizontal_layout.html.twig' => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap5_horizontal.html.twig',
        'bootstrap_4_layout.html.twig'            => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap4.html.twig',
        'bootstrap_4_horizontal_layout.html.twig' => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap4_horizontal.html.twig',
        'bootstrap_3_layout.html.twig'            => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap3.html.twig',
        'bootstrap_3_horizontal_layout.html.twig' => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_bootstrap3_horizontal.html.twig',
        'foundation_5_layout.html.twig'           => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_foundation5.html.twig',
        'foundation_6_layout.html.twig'           => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_foundation6.html.twig',
        'tailwind_2_layout.html.twig'             => '@NowoTiptapEditorBundle/Form/tiptap_editor_theme_tailwind2.html.twig',
    ];

    public function load(array $configs, ContainerBuilder $container): void
    {
        $loader = new YamlFileLoader($container, new FileLocator(__DIR__ . '/../Resources/config'));
        $loader->load('services.yaml');

        $config         = $this->processConfiguration(new Configuration(), $configs);
        $defaultName    = $config['default_profile'];
        $defaultProfile = $config['profiles'][$defaultName];

        $container->setParameter(Configuration::ALIAS . '.default_profile', $defaultName);
        $container->setParameter(Configuration::ALIAS . '.profiles', $config['profiles']);
        // Legacy parameter names (same values) for BC.
        $container->setParameter(Configuration::ALIAS . '.default_config', $defaultName);
        $container->setParameter(Configuration::ALIAS . '.configs', $config['profiles']);

        // Backward compatibility: scalar parameters mirror the default profile (same names as before multi-config).
        $container->setParameter(Configuration::ALIAS . '.toolbar', $defaultProfile['toolbar']);
        $container->setParameter(Configuration::ALIAS . '.min_height', $defaultProfile['min_height']);
        $container->setParameter(Configuration::ALIAS . '.form_theme', $defaultProfile['form_theme']);
        $container->setParameter(Configuration::ALIAS . '.debug', $defaultProfile['debug']);
        $container->setParameter(Configuration::ALIAS . '.variant', $defaultProfile['variant']);
        $container->setParameter(Configuration::ALIAS . '.theme', $defaultProfile['theme'] ?? 'light');
    }

    public function prepend(ContainerBuilder $container): void
    {
        if (!$container->hasExtension('twig')) {
            return;
        }

        $configs = $container->getExtensionConfig(Configuration::ALIAS);
        /** @var array{default_profile: string, profiles: array<string, array<string, mixed>>} $config */
        $config = $this->processConfiguration(new Configuration(), $configs);

        $themePaths = $this->orderedFormThemePaths($config);
        $container->prependExtensionConfig('twig', [
            'form_themes' => $themePaths,
        ]);
    }

    /**
     * Unique Twig form theme paths; the default profile theme is first, then others (sorted).
     *
     * @param array{default_profile: string, profiles: array<string, array<string, mixed>>} $processedConfig
     *
     * @return list<string>
     */
    private function orderedFormThemePaths(array $processedConfig): array
    {
        $profiles     = $processedConfig['profiles'];
        $defaultName  = $processedConfig['default_profile'];
        $defaultTheme = $profiles[$defaultName]['form_theme'] ?? 'form_div_layout.html.twig';
        $defaultPath  = self::FORM_THEME_MAP[$defaultTheme] ?? self::FORM_THEME_MAP['form_div_layout.html.twig'];

        $unique = [];
        foreach ($profiles as $profile) {
            $ft         = $profile['form_theme'] ?? 'form_div_layout.html.twig';
            $p          = self::FORM_THEME_MAP[$ft] ?? self::FORM_THEME_MAP['form_div_layout.html.twig'];
            $unique[$p] = true;
        }

        $others = array_keys($unique);
        sort($others);
        $rest = array_values(array_filter($others, static fn (string $p): bool => $p !== $defaultPath));

        return array_merge([$defaultPath], $rest);
    }

    public function getAlias(): string
    {
        return Configuration::ALIAS;
    }
}
