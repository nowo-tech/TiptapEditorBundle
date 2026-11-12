<?php

declare(strict_types=1);

namespace App\Form;

use Nowo\FormKitBundle\Attribute\FormKitConfig;
use Nowo\FormKitBundle\Form\FormOptionsTrait;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * REQ-DEMO-015: a FormKit form (profile `demo`) with CSRF. Every demo page lists its editors; each one is the bundle's
 * TiptapEditorType added through FormKit's addTiptapEditor().
 *
 * @extends AbstractType<array<string, string>>
 */
#[FormKitConfig('demo')]
final class EditorDemoType extends AbstractType
{
    use FormOptionsTrait;

    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        /** @var array<string, array<string, mixed>> $editors */
        $editors = $options['editors'];
        foreach ($editors as $name => $editorOptions) {
            $this->addTiptapEditor($builder, $name, $editorOptions + [
                'placeholder'        => false,
                'help'               => false,
                'translation_domain' => 'messages',
            ]);
        }

        $this->addWithDefaults($builder, 'submit', SubmitType::class, [
            'label'              => $options['submit_label'],
            'translation_domain' => 'messages',
            'attr'               => ['class' => 'nowo-ui-btn nowo-ui-btn--primary'],
        ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            'editors'            => [],
            'submit_label'       => 'demo.submit',
            'translation_domain' => 'messages',
        ]);
        $resolver->setAllowedTypes('editors', 'array');
        $resolver->setAllowedTypes('submit_label', 'string');
    }
}
