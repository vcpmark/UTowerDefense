/**
 * Texture Loader
 * Loads and manages textures for WebGL rendering
 */

export class TextureLoader {
  constructor(gl) {
    this.gl = gl;
    this.textures = new Map();
    this.loadingTextures = new Map();
  }

  async loadTexture(url) {
    // Return cached texture if available
    if (this.textures.has(url)) {
      return this.textures.get(url);
    }

    // Return loading promise if already loading
    if (this.loadingTextures.has(url)) {
      return this.loadingTextures.get(url);
    }

    // Start loading
    const promise = this._loadTextureInternal(url);
    this.loadingTextures.set(url, promise);

    try {
      const texture = await promise;
      this.textures.set(url, texture);
      this.loadingTextures.delete(url);
      return texture;
    } catch (error) {
      this.loadingTextures.delete(url);
      throw error;
    }
  }

  async _loadTextureInternal(url, timeoutMs = 10000) {
    const gl = this.gl;

    console.log(`[TextureLoader] Starting to load: ${url}`);

    return new Promise((resolve, reject) => {
      const image = new Image();
      let timeoutId = null;
      let resolved = false;

      // Timeout handler
      const timeout = () => {
        if (!resolved) {
          resolved = true;
          image.onload = null;
          image.onerror = null;
          image.src = '';
          console.error(`[TextureLoader] Timeout loading texture: ${url} (waited ${timeoutMs}ms)`);
          reject(new Error(`Timeout loading texture: ${url}`));
        }
      };

      image.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);

        console.log(`[TextureLoader] Image loaded successfully: ${url} (${image.width}x${image.height})`);

        try {
          const texture = gl.createTexture();
          if (!texture) {
            throw new Error('Failed to create WebGL texture');
          }

          gl.bindTexture(gl.TEXTURE_2D, texture);

          // Set texture parameters
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

          // Upload image data
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

          // Check for GL errors
          const error = gl.getError();
          if (error !== gl.NO_ERROR) {
            throw new Error(`WebGL error while creating texture: ${error}`);
          }

          // Store texture metadata
          texture.width = image.width;
          texture.height = image.height;
          texture.url = url;

          console.log(`[TextureLoader] WebGL texture created successfully for: ${url}`);
          resolve(texture);
        } catch (error) {
          console.error(`[TextureLoader] Error creating WebGL texture for ${url}:`, error);
          reject(error);
        }
      };

      image.onerror = (event) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        console.error(`[TextureLoader] Image load error for: ${url}`, event);
        reject(new Error(`Failed to load texture: ${url}`));
      };

      // Start timeout
      timeoutId = setTimeout(timeout, timeoutMs);

      // Handle relative paths for GitHub Pages
      console.log(`[TextureLoader] Setting image.src to: ${url}`);
      image.src = url;
    });
  }

  async loadTextures(urls) {
    return Promise.all(urls.map(url => this.loadTexture(url)));
  }

  getTexture(url) {
    return this.textures.get(url);
  }

  hasTexture(url) {
    return this.textures.has(url);
  }

  deleteTexture(url) {
    const texture = this.textures.get(url);
    if (texture) {
      this.gl.deleteTexture(texture);
      this.textures.delete(url);
    }
  }

  clear() {
    for (const texture of this.textures.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textures.clear();
    this.loadingTextures.clear();
  }
}
