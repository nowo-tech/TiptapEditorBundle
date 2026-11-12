<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Kernel;

use Nowo\TiptapEditorBundle\NowoTiptapEditorBundle;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\Component\Routing\Loader\Configurator\RoutingConfigurator;

use function dirname;
use function getmypid;
use function sys_get_temp_dir;

/**
 * Host-like kernel for the kept-alive worker test: one host route (`/{_locale}/edit`) builds, submits and renders a form
 * containing the Tiptap field, as a host controller would. The dev lock has no symfony/translation, so a host-like
 * `trans` filter (translating by the request locale) stands in for the translator.
 */
final class WorkerKeptAliveKernel extends Kernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new TwigBundle();
        yield new NowoTiptapEditorBundle();
    }

    public function getProjectDir(): string
    {
        return dirname(__DIR__, 2);
    }

    public function getCacheDir(): string
    {
        return sys_get_temp_dir() . '/nowo-tiptap-editor-bundle-worker/' . getmypid() . '/' . $this->environment;
    }

    public function getLogDir(): string
    {
        return sys_get_temp_dir() . '/nowo-tiptap-editor-bundle-worker/' . getmypid() . '/log';
    }

    private function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret'                => 'test-secret',
            'test'                  => true,
            'http_method_override'  => false,
            'handle_all_throwables' => true,
            'php_errors'            => ['log' => true],
            'router'                => ['utf8' => true],
            'default_locale'        => 'en',
            'property_info'         => ['enabled' => false],
        ]);
        $container->extension('twig', ['default_path' => '%kernel.project_dir%/tests/Fixtures/templates']);
        $container->services()
            ->set(HostTransExtension::class)
                ->autowire()
                ->tag('twig.extension')
            ->set(HostEditController::class)
                ->autowire()
                ->public()
                ->tag('controller.service_arguments');
    }

    private function configureRoutes(RoutingConfigurator $routes): void
    {
        $routes->add('host_edit', '/{_locale}/edit')->controller(HostEditController::class)->methods(['GET', 'POST']);
    }
}
