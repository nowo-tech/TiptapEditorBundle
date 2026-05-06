<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit;

use Nowo\TiptapEditorBundle\EditorVariant;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Nowo\TiptapEditorBundle\EditorVariant
 */
final class EditorVariantTest extends TestCase
{
    public function testValuesListsAllCases(): void
    {
        $values = EditorVariant::values();
        self::assertSame(
            ['default', 'simple', 'notion', 'agent', 'headless'],
            $values,
        );
    }

    public function testFromStringMatchesCaseInsensitive(): void
    {
        self::assertSame(EditorVariant::Notion, EditorVariant::fromString('NOTION'));
        self::assertSame(EditorVariant::Simple, EditorVariant::fromString(' simple '));
    }

    public function testFromStringUnknownFallsBackToDefault(): void
    {
        self::assertSame(EditorVariant::Default, EditorVariant::fromString(''));
        self::assertSame(EditorVariant::Default, EditorVariant::fromString('no-such-variant'));
    }
}
