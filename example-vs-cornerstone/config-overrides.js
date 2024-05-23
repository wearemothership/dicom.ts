module.exports = function override (config, env) {
    console.log('override')
    let loaders = config.resolve
    loaders.fallback = {
        "fs": require.resolve("browserify-fs"),
        "path": require.resolve("path-browserify"),
		"stream": require.resolve("stream-browserify"),
		"buffer": require.resolve("buffer")
    }
    
    return config
}
