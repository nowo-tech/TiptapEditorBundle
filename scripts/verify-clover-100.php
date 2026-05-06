<?php

declare(strict_types=1);

/**
 * Fails if Clover coverage.xml does not report 100% covered statements (bundle PHP src/).
 */
$coveragePath = dirname(__DIR__) . '/coverage.xml';
if (!is_file($coveragePath)) {
    fwrite(\STDERR, "coverage.xml not found. Run composer test-coverage (phpunit --coverage-clover coverage.xml) first.\n");
    exit(1);
}

$xml = simplexml_load_file($coveragePath);
if ($xml === false) {
    fwrite(\STDERR, "Invalid XML: {$coveragePath}\n");
    exit(1);
}

$metrics = $xml->project->metrics;
$total   = (int) $metrics['statements'];
$covered = (int) $metrics['coveredstatements'];

if ($total < 1) {
    fwrite(\STDERR, "No statement metrics in coverage.xml.\n");
    exit(1);
}

if ($covered !== $total) {
    fwrite(\STDERR, "PHP coverage must be 100% lines (Clover statements): {$covered}/{$total} covered.\n");
    exit(1);
}

fwrite(\STDOUT, "Clover: 100% statement coverage ({$covered}/{$total}).\n");
