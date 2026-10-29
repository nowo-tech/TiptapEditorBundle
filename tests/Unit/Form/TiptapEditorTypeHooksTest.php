<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Unit\Form;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\Exception\InvalidOptionsException;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * 1.6: upload and suggestion hook options.
 */
final class TiptapEditorTypeHooksTest extends TestCase
{
    public function testHooksAreOffByDefaultAndReachTheView(): void
    {
        $type     = $this->type();
        $defaults = $this->resolve($type, []);

        self::assertNull($defaults['upload_url']);
        self::assertNull($defaults['upload_csrf_token']);
        self::assertSame([], $defaults['suggestions']);

        $options = $this->resolve($type, [
            'upload_url'        => '/upload',
            'upload_csrf_token' => 'tok',
            'suggestions'       => [['trigger' => '@', 'url' => '/people', 'ignored' => 1]],
        ]);
        $view = new FormView();
        $type->buildView($view, $this->createStub(FormInterface::class), $options);

        self::assertSame('/upload', $view->vars['tiptap_upload_url']);
        self::assertSame('tok', $view->vars['tiptap_upload_csrf_token']);
        self::assertSame([['trigger' => '@', 'url' => '/people']], $view->vars['tiptap_suggestions']);
    }

    public function testASuggestionWithoutTriggerOrUrlIsRefused(): void
    {
        $this->expectException(InvalidOptionsException::class);
        $this->resolve($this->type(), ['suggestions' => [['trigger' => '', 'url' => '/x']]]);
    }

    public function testASuggestionThatIsNotAnArrayIsRefused(): void
    {
        $this->expectException(InvalidOptionsException::class);
        $this->resolve($this->type(), ['suggestions' => ['@']]);
    }

    /**
     * @param array<string, mixed> $options
     *
     * @return array<string, mixed>
     */
    private function resolve(TiptapEditorType $type, array $options): array
    {
        $resolver = new OptionsResolver();
        $type->configureOptions($resolver);

        return $resolver->resolve($options);
    }

    private function type(): TiptapEditorType
    {
        return new TiptapEditorType(['default' => [
            'toolbar'    => true,
            'min_height' => '240px',
            'form_theme' => 'form_div_layout.html.twig',
            'debug'      => false,
            'variant'    => 'default',
        ]], 'default');
    }
}
