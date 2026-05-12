<?php

declare(strict_types=1);

namespace App\Controller;

use Nowo\TiptapEditorBundle\Form\TiptapEditorType;
use Nowo\TiptapEditorBundle\TiptapExample;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\Translation\TranslatorInterface;

use function array_key_exists;
use function in_array;
use function is_string;

/**
 * Demo: home, single editor, and named bundle configs (full reference + simple, notion, agent, headless).
 */
class TiptapDemoController extends AbstractController
{
    private const LOCALE_REQ = ['_locale' => 'en|es'];

    /** @var array<string, TiptapExample|null> slug → recipe (null = default StarterKit demo) */
    private const EXAMPLES_LIVE = [
        'default-text-editor' => null,
        'formatting'          => TiptapExample::Formatting,
        'images'              => TiptapExample::Images,
        'long-text'           => TiptapExample::LongText,
        'markdown-shortcuts'  => TiptapExample::MarkdownShortcuts,
        'minimal-setup'       => TiptapExample::Minimal,
        'tables'              => TiptapExample::Tables,
        'tasks'               => TiptapExample::Tasks,
        'text-direction-rtl'  => TiptapExample::TextDirectionRtl,
        'menus'               => TiptapExample::Menus,
        'syntax-highlighting' => TiptapExample::SyntaxHighlighting,
    ];

    /** @var list<string> */
    private const EXAMPLES_STUB = [
        'clever-editor',
        'collaborative-editing',
        'drawing',
        'forced-content-structure',
        'interactive-react-vue',
        'react-performance',
        'mentions',
        'ai-agent',
        'collaborative-fields',
        'figure',
        'generic-figure',
        'iframe',
        'linting',
        'slash-commands',
    ];

    public function __construct(
        private readonly TranslatorInterface $translator,
    ) {
    }

    #[Route(path: '/', name: 'app_root', methods: ['GET'])]
    public function root(): RedirectResponse
    {
        return $this->redirectToRoute('app_home', ['_locale' => 'en']);
    }

    #[Route(path: '/{_locale}/', name: 'app_home', requirements: self::LOCALE_REQ, defaults: ['_locale' => 'en'], methods: ['GET'])]
    public function home(Request $request): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));

        return $this->render('tiptap_demo/home.html.twig');
    }

    #[Route(path: '/{_locale}/demo', name: 'app_demo', requirements: self::LOCALE_REQ, defaults: ['_locale' => 'en'], methods: ['GET', 'POST'])]
    public function demo(Request $request): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));
        $field = 'content';
        $html  = $request->query->get('html', '<p>Hello Tiptap</p>');
        $data  = [$field => is_string($html) ? $html : '<p>Hello Tiptap</p>'];

        $form = $this->createFormBuilder($data, ['translation_domain' => 'messages'])
            ->add($field, TiptapEditorType::class, [
                'label'              => 'demo.body_label',
                'translation_domain' => 'messages',
            ])
            ->getForm();

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->addFlash(
                'success',
                $this->translator->trans('demo.saved', [], 'messages'),
            );
        }

        return $this->render('tiptap_demo/show.html.twig', [
            'form'        => $form,
            'saved_value' => (string) ($form->get($field)->getData() ?? ''),
        ]);
    }

    #[Route(path: '/{_locale}/demo/configs', name: 'app_demo_configs', requirements: self::LOCALE_REQ, defaults: ['_locale' => 'en'], methods: ['GET', 'POST'])]
    public function demoConfigs(Request $request): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));

        $data = [
            'content_full'     => '<p>' . $this->translator->trans('demo.sample_full', [], 'messages') . '</p>',
            'content_simple'   => '<p>' . $this->translator->trans('demo.sample_simple', [], 'messages') . '</p>',
            'content_notion'   => '<h2>' . $this->translator->trans('demo.sample_notion_title', [], 'messages') . '</h2><p>' . $this->translator->trans('demo.sample_notion_body', [], 'messages') . '</p>',
            'content_agent'    => '<p>' . $this->translator->trans('demo.sample_agent', [], 'messages') . '</p>',
            'content_headless' => '<p>' . $this->translator->trans('demo.sample_headless', [], 'messages') . '</p>',
        ];

        $form = $this->createFormBuilder($data, ['translation_domain' => 'messages'])
            ->add('content_full', TiptapEditorType::class, [
                'config'             => 'full',
                'label'              => 'demo.profile_full_label',
                'help'               => 'demo.profile_full_help',
                'translation_domain' => 'messages',
            ])
            ->add('content_simple', TiptapEditorType::class, [
                'config'             => 'simple',
                'label'              => 'demo.profile_simple_label',
                'help'               => 'demo.profile_simple_help',
                'translation_domain' => 'messages',
            ])
            ->add('content_notion', TiptapEditorType::class, [
                'config'             => 'notion',
                'label'              => 'demo.profile_notion_label',
                'help'               => 'demo.profile_notion_help',
                'translation_domain' => 'messages',
            ])
            ->add('content_agent', TiptapEditorType::class, [
                'config'             => 'agent',
                'label'              => 'demo.profile_agent_label',
                'help'               => 'demo.profile_agent_help',
                'translation_domain' => 'messages',
            ])
            ->add('content_headless', TiptapEditorType::class, [
                'config'             => 'headless',
                'label'              => 'demo.profile_headless_label',
                'help'               => 'demo.profile_headless_help',
                'translation_domain' => 'messages',
            ])
            ->getForm();

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->addFlash(
                'success',
                $this->translator->trans('demo.saved_configs', [], 'messages'),
            );
        }

        return $this->render('tiptap_demo/configs.html.twig', [
            'form' => $form,
        ]);
    }

    /**
     * Tabs like tiptap.dev: Agent, Notion-like, Simple, Headless (open-source extensions; AI/slash UI need Tiptap Platform).
     *
     * @see https://tiptap.dev/
     */
    #[Route(path: '/{_locale}/demo/showcase', name: 'app_showcase', requirements: self::LOCALE_REQ, defaults: ['_locale' => 'en'], methods: ['GET', 'POST'])]
    public function showcase(Request $request): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));

        $data = [
            'showcase_agent'    => $this->translator->trans('demo.showcase_agent_initial_html', [], 'messages'),
            'showcase_notion'   => $this->translator->trans('demo.showcase_notion_initial_html', [], 'messages'),
            'showcase_simple'   => $this->translator->trans('demo.showcase_simple_initial_html', [], 'messages'),
            'showcase_headless' => $this->translator->trans('demo.showcase_headless_initial_html', [], 'messages'),
        ];

        $form = $this->createFormBuilder($data, ['translation_domain' => 'messages'])
            ->add('showcase_agent', TiptapEditorType::class, [
                'config'             => 'agent',
                'label'              => 'demo.showcase_field_agent',
                'help'               => 'demo.showcase_help_agent',
                'translation_domain' => 'messages',
            ])
            ->add('showcase_notion', TiptapEditorType::class, [
                'config'             => 'notion',
                'label'              => 'demo.showcase_field_notion',
                'help'               => 'demo.showcase_help_notion',
                'placeholder'        => 'demo.showcase_notion_placeholder',
                'translation_domain' => 'messages',
            ])
            ->add('showcase_simple', TiptapEditorType::class, [
                'config'             => 'simple',
                'label'              => 'demo.showcase_field_simple',
                'help'               => 'demo.showcase_help_simple',
                'translation_domain' => 'messages',
            ])
            ->add('showcase_headless', TiptapEditorType::class, [
                'config'             => 'headless',
                'label'              => 'demo.showcase_field_headless',
                'help'               => 'demo.showcase_help_headless',
                'translation_domain' => 'messages',
            ])
            ->getForm();

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->addFlash('success', $this->translator->trans('demo.saved_showcase', [], 'messages'));
        }

        return $this->render('tiptap_demo/showcase.html.twig', [
            'form' => $form,
        ]);
    }

    /**
     * Hub mirroring https://tiptap.dev/docs/examples — live recipes use {@see TiptapExample}; stubs link to official docs.
     */
    #[Route(path: '/{_locale}/demo/examples', name: 'app_examples_index', requirements: self::LOCALE_REQ, defaults: ['_locale' => 'en'], methods: ['GET'])]
    public function examplesIndex(Request $request): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));

        return $this->render('tiptap_demo/examples_index.html.twig', [
            'liveExampleSlugs' => array_keys(self::EXAMPLES_LIVE),
            'sections'         => [
                [
                    'title' => 'examples.section_basics',
                    'slugs' => [
                        'default-text-editor',
                        'formatting',
                        'images',
                        'long-text',
                        'markdown-shortcuts',
                        'minimal-setup',
                        'tables',
                        'tasks',
                        'text-direction-rtl',
                    ],
                ],
                [
                    'title' => 'examples.section_advanced',
                    'slugs' => [
                        'menus',
                        'syntax-highlighting',
                        'clever-editor',
                        'collaborative-editing',
                        'drawing',
                        'forced-content-structure',
                        'interactive-react-vue',
                        'react-performance',
                        'mentions',
                    ],
                ],
                [
                    'title' => 'examples.section_experiments',
                    'slugs' => [
                        'ai-agent',
                        'collaborative-fields',
                        'figure',
                        'generic-figure',
                        'iframe',
                        'linting',
                        'slash-commands',
                    ],
                ],
            ],
        ]);
    }

    #[Route(path: '/{_locale}/demo/examples/{slug}', name: 'app_examples_show', requirements: self::LOCALE_REQ + ['slug' => '[a-z0-9\-]+'], defaults: ['_locale' => 'en'], methods: ['GET', 'POST'])]
    public function examplesShow(Request $request, string $slug): Response
    {
        $request->setLocale((string) $request->attributes->get('_locale', 'en'));

        if (in_array($slug, self::EXAMPLES_STUB, true)) {
            return $this->render('tiptap_demo/examples_stub.html.twig', [
                'slug' => $slug,
            ]);
        }

        if (!array_key_exists($slug, self::EXAMPLES_LIVE)) {
            throw $this->createNotFoundException('Unknown example slug.');
        }

        $example = self::EXAMPLES_LIVE[$slug];

        $initialKey = 'examples.initial.' . $slug;
        $content    = $this->translator->trans($initialKey, [], 'messages');

        $field = 'content';
        $data  = [$field => $content];

        $minHeight = match ($slug) {
            'long-text'           => '560px',
            'tables'              => '360px',
            'syntax-highlighting' => '320px',
            default               => null,
        };

        $builder = $this->createFormBuilder($data, ['translation_domain' => 'messages'])
            ->add($field, TiptapEditorType::class, array_filter([
                'config'             => 'simple',
                'example'            => $example,
                'label'              => false,
                'translation_domain' => 'messages',
                'min_height'         => $minHeight,
            ], static fn ($v) => $v !== null));

        $form = $builder->getForm();
        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {
            $this->addFlash('success', $this->translator->trans('examples.saved', [], 'messages'));
        }

        return $this->render('tiptap_demo/examples_show.html.twig', [
            'slug'         => $slug,
            'form'         => $form,
            'saved_value'  => (string) ($form->get($field)->getData() ?? ''),
        ]);
    }
}
