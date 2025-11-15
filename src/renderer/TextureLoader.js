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
          reject(new Error(`Timeout loading texture: ${url}`));
        }
      };

      image.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload image data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // Store texture metadata
        texture.width = image.width;
        texture.height = image.height;
        texture.url = url;

        resolve(texture);
      };

      image.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        reject(new Error(`Failed to load texture: ${url}`));
      };

      // Start timeout
      timeoutId = setTimeout(timeout, timeoutMs);

      // Handle relative paths for GitHub Pages
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
