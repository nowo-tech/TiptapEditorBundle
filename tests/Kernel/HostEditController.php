<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Kernel;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Symfony\Component\Form\Extension\Core\Type\FormType;
use Symfony\Component\Form\FormFactoryInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Twig\Environment;

/**
 * Host controller of the kept-alive test: the upload hook (`u`, `t` query) is per user, the body is submitted by POST.
 */
final class HostEditController
{
    public function __construct(
        private readonly FormFactoryInterface $formFactory,
        private readonly Environment $twig,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $form = $this->formFactory->createNamedBuilder('host', FormType::class)
            ->add('body', TiptapEditorType::class, [
                'upload_url'        => $request->query->getString('u'),
                'upload_csrf_token' => $request->query->getString('t'),
            ])
            ->getForm();
        $form->handleRequest($request);

        $html = $this->twig->createTemplate('{{ form_widget(form) }}')->render(['form' => $form->createView()]);

        return new Response($form->isSubmitted() && $form->isValid() ? 'saved:' . (string) $form->get('body')->getData() . "\n" . $html : $html);
    }
}
