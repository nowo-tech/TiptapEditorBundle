<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\Security\AllowlistTiptapHtmlSanitizer;
use Nowo\TiptapEditorBundle\Twig\NowoTiptapEditorTwigExtension;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use ReflectionProperty;

/**
 * Guards FrankenPHP worker mode with kernel not reset between requests (scenario B).
 *
 * Shared container services must not keep mutable per-request state.
 *
 * @coversNothing
 */
final class FrankenPhpWorkerSafetyTest extends TestCase
{
    /**
     * @return iterable<string, array{class-string}>
     */
    public static function sharedServiceClasses(): iterable
    {
        yield 'form type' => [TiptapEditorType::class];
        yield 'allowlist sanitizer' => [AllowlistTiptapHtmlSanitizer::class];
        yield 'twig extension' => [NowoTiptapEditorTwigExtension::class];
    }

    /**
     * @param class-string $class
     */
    #[DataProvider('sharedServiceClasses')]
    public function testSharedServicesHaveNoMutableInstanceState(string $class): void
    {
        $reflection = new ReflectionClass($class);

        foreach ($reflection->getProperties(ReflectionProperty::IS_STATIC) as $property) {
            if ($property->getDeclaringClass()->getName() !== $class) {
                continue;
            }
            self::fail(sprintf('%s must not declare static properties for worker safety; found $%s.', $class, $property->getName()));
        }

        $checked = 0;
        foreach ($reflection->getProperties() as $property) {
            if ($property->isStatic() || $property->getDeclaringClass()->getName() !== $class) {
                continue;
            }
            ++$checked;
            self::assertTrue(
                $property->isReadOnly(),
                sprintf('%s::$%s must be readonly (or absent) so FrankenPHP workers without kernel reset cannot leak request state.', $class, $property->getName()),
            );
        }

        self::assertGreaterThanOrEqual(
            0,
            $checked,
            sprintf('%s was inspected for mutable instance state.', $class),
        );
        // Classes with only constants (sanitizer, Twig extension) still pass when $checked === 0.
        self::assertTrue(true);
    }
}
