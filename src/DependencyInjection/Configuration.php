<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\DependencyInjection;

use Nowo\TiptapEditorBundle\EditorVariant;
use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;

use function array_key_exists;
use function is_array;
use function sprintf;

/**
 * Bundle configuration: named profiles (toolbar, min_height, form_theme, debug, theme) plus a default profile key.
 *
 * Legacy YAML keys `default_config` / `configs` are accepted and mapped to `default_profile` / `profiles`.
 * Flat options under `nowo_tiptap_editor` are normalized into `profiles.default`.
 *
 * Each profile may set `variant` ({@see EditorVariant}) for CSS + JS behaviour presets.
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class Configuration implements ConfigurationInterface
{
    public const ALIAS = 'nowo_tiptap_editor';

    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder(self::ALIAS);
        $root        = $treeBuilder->getRootNode();

        $root
            ->beforeNormalization()
            ->always(static function ($v) {
                if (!is_array($v)) {
                    return $v;
                }

                if (!isset($v['profiles']) && isset($v['configs'])) {
                    $v['profiles'] = $v['configs'];
                    unset($v['configs']);
                }
                if (!isset($v['default_profile']) && isset($v['default_config'])) {
                    $v['default_profile'] = $v['default_config'];
                    unset($v['default_config']);
                }

                if (isset($v['profiles'])) {
                    return $v;
                }

                $defaultProfile = $v['default_profile'] ?? 'default';
                $profile        = [];
                foreach (['toolbar', 'min_height', 'form_theme', 'debug', 'variant', 'theme'] as $key) {
                    if (array_key_exists($key, $v)) {
                        $profile[$key] = $v[$key];
                    }
                }

                return [
                    'default_profile' => $defaultProfile,
                    'profiles'        => [
                        'default' => $profile,
                    ],
                ];
            })
            ->end()
            ->children()
                ->scalarNode('default_profile')
                    ->defaultValue('default')
                    ->info('Profile name used when the form field omits the "config" option (form option key remains "config" for BC).')
                ->end()
                ->arrayNode('profiles')
                    ->info('Named profiles; each field may reference one via the "config" form option.')
                    ->useAttributeAsKey('name')
                    ->requiresAtLeastOneElement()
                    ->prototype('array')
                        ->children()
                            ->booleanNode('toolbar')
                                ->info('When true, the frontend shows a compact formatting toolbar (bold, lists, undo, etc.).')
                                ->defaultTrue()
                            ->end()
                            ->scalarNode('min_height')
                                ->info('Default CSS min-height for the editor surface (e.g. 240px, 12rem).')
                                ->defaultValue('240px')
                            ->end()
                            ->scalarNode('form_theme')
                                ->info('Base Symfony form layout (must match twig.form_themes in your app).')
                                ->defaultValue('form_div_layout.html.twig')
                            ->end()
                            ->booleanNode('debug')
                                ->info('When true, the browser console receives detailed logs from the bundle script.')
                                ->defaultFalse()
                            ->end()
                            ->scalarNode('variant')
                                ->info('Editor UX preset: default, simple, notion, agent, headless (see EditorVariant).')
                                ->defaultValue(EditorVariant::Default->value)
                                ->validate()
                                    ->ifNotInArray(EditorVariant::values())
                                    ->thenInvalid('Invalid nowo_tiptap_editor variant %s.')
                                ->end()
                            ->end()
                            ->scalarNode('theme')
                                ->info('Chrome palette: light, dark, or auto (follows prefers-color-scheme).')
                                ->defaultValue('light')
                                ->validate()
                                    ->ifNotInArray(['light', 'dark', 'auto'])
                                    ->thenInvalid('Invalid nowo_tiptap_editor theme %s.')
                                ->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->validate()
            ->always(static function (array $v): array {
                if (!isset($v['profiles'][$v['default_profile']])) {
                    throw new InvalidConfigurationException(sprintf('nowo_tiptap_editor.default_profile ("%s") must exist in nowo_tiptap_editor.profiles (keys: %s).', $v['default_profile'], implode(', ', array_keys($v['profiles']))));
                }

                return $v;
            })
            ->end();

        return $treeBuilder;
    }
}
