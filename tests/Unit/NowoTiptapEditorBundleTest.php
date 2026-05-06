<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit;

use Nowo\TiptapEditorBundle\DependencyInjection\Compiler\TwigPathsPass;
use Nowo\TiptapEditorBundle\NowoTiptapEditorBundle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ContainerBuilder;

/**
 * @covers \Nowo\TiptapEditorBundle\NowoTiptapEditorBundle
 */
final class NowoTiptapEditorBundleTest extends TestCase
{
    public function testBundleCanBeInstantiated(): void
    {
        $bundle = new NowoTiptapEditorBundle();
        /* @phpstan-ignore staticMethod.alreadyNarrowedType (ensures bundle type) */
        self::assertInstanceOf(NowoTiptapEditorBundle::class, $bundle);
    }

    public function testBuildRegistersTwigPathsPass(): void
    {
        $bundle    = new NowoTiptapEditorBundle();
        $container = new ContainerBuilder();
        $bundle->build($container);

        $names = [];
        foreach ($container->getCompilerPassConfig()->getBeforeOptimizationPasses() as $pass) {
            $names[] = $pass::class;
        }

        self::assertContains(TwigPathsPass::class, $names);
    }
}
