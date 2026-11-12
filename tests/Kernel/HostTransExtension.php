<?php

declare(strict_types=1);

namespace Nowo\TiptapEditorBundle\Tests\Kernel;

use Symfony\Component\HttpFoundation\RequestStack;
use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/**
 * Stand-in for the host's translator in the kept-alive test: the `trans` filter marks the message with the domain and
 * the locale of the current request, so a locale carried over between requests is visible in the output.
 */
final class HostTransExtension extends AbstractExtension
{
    public function __construct(private readonly RequestStack $requestStack)
    {
    }

    public function getFilters(): array
    {
        return [new TwigFilter('trans', $this->trans(...))];
    }

    /**
     * @param array<string, mixed> $arguments
     */
    public function trans(string $message, array $arguments = [], ?string $domain = null, ?string $locale = null): string
    {
        return $message . '[' . ($domain ?? 'messages') . '@' . ($locale ?? $this->requestStack->getCurrentRequest()?->getLocale() ?? 'none') . ']';
    }
}
