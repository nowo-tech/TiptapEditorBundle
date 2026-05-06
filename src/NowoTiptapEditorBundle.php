<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle;

use Nowo\TiptapEditorBundle\DependencyInjection\Compiler\TwigPathsPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

/**
 * Rich text form field powered by Tiptap (ProseMirror), similar to a classic CKEditor-style textarea replacement.
 *
 * @author Héctor Franco Aceituno <hectorfranco@nowo.tech>
 */
final class NowoTiptapEditorBundle extends Bundle
{
    /**
     * Registers compiler passes for Twig template paths.
     */
    public function build(ContainerBuilder $container): void
    {
        $container->addCompilerPass(new TwigPathsPass());
    }
}
