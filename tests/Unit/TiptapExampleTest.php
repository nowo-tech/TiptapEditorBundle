<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit;

use Nowo\TiptapEditorBundle\TiptapExample;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Nowo\TiptapEditorBundle\TiptapExample
 */
final class TiptapExampleTest extends TestCase
{
    public function testValuesListsAllCases(): void
    {
        $values = TiptapExample::values();
        self::assertCount(10, $values);
        self::assertContains('tables', $values);
        self::assertContains('syntax_highlighting', $values);
    }
}
