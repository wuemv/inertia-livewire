<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>inertia-livewire e2e (React)</title>
    <link rel="icon" href="data:,">
    @livewireStyles
</head>
<body>
    <div id="app"></div>
    <script type="application/json" id="props">@json($props)</script>
    @livewireScripts
    <script type="module" src="/e2e-js/react-page.js"></script>
</body>
</html>
