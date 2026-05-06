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
 * Legacy (flat) options under `nowo_tiptap_editor` are normalized into `configs.default`.
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
                if (isset($v['configs'])) {
                    return $v;
                }

                $defaultConfig = $v['default_config'] ?? 'default';
                $profile       = [];
                foreach (['toolbar', 'min_height', 'form_theme', 'debug', 'variant', 'theme'] as $key) {
                    if (array_key_exists($key, $v)) {
                        $profile[$key] = $v[$key];
                    }
                }

                return [
                    'default_config' => $defaultConfig,
                    'configs'        => [
                        'default' => $profile,
                    ],
                ];
            })
            ->end()
            ->children()
                ->scalarNode('default_config')
                    ->defaultValue('default')
                    ->info('Profile name used when the form field omits the "config" option.')
                ->end()
                ->arrayNode('configs')
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
                if (!isset($v['configs'][$v['default_config']])) {
                    throw new InvalidConfigurationException(sprintf('nowo_tiptap_editor.default_config ("%s") must exist in nowo_tiptap_editor.configs (keys: %s).', $v['default_config'], implode(', ', array_keys($v['configs']))));
                }

                return $v;
            })
            ->end();

        return $treeBuilder;
    }
}
