/**
 * Modern WebGL2 Renderer with Batch Rendering
 * Handles efficient sprite rendering, particles, and effects
 */

export class WebGLRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: options.alpha !== false,
      antialias: options.antialias !== false,
      premultipliedAlpha: false
    });

    if (!this.gl) {
      throw new Error('WebGL2 not supported');
    }

    this.width = canvas.width;
    this.height = canvas.height;
    this.pixelRatio = options.pixelRatio || window.devicePixelRatio || 1;

    // Batch rendering state
    this.maxBatchSize = 10000;
    this.currentBatch = [];
    this.drawCalls = 0;

    // Shader programs
    this.programs = {};

    // Projection matrix
    this.projectionMatrix = this.createOrthographicMatrix(0, this.width, this.height, 0, -1, 1);

    this.init();
  }

  init() {
    const gl = this.gl;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Create shader programs
    this.createShapeProgram();
    this.createSpriteProgram();

    // Create buffers
    this.createBuffers();
  }

  createShapeProgram() {
    const gl = this.gl;

    const vertexShader = `#version 300 es
      precision highp float;

      in vec2 a_position;
      in vec4 a_color;

      uniform mat4 u_projection;

      out vec4 v_color;

      void main() {
        gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `;

    const fragmentShader = `#version 300 es
      precision highp float;

      in vec4 v_color;
      out vec4 outColor;

      void main() {
        outColor = v_color;
      }
    `;

    this.programs.shape = this.createProgram(vertexShader, fragmentShader);
  }

  createSpriteProgram() {
    const gl = this.gl;

    const vertexShader = `#version 300 es
      precision highp float;

      in vec2 a_position;
      in vec2 a_texCoord;
      in vec4 a_color;

      uniform mat4 u_projection;

      out vec2 v_texCoord;
      out vec4 v_color;

      void main() {
        gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_color = a_color;
      }
    `;

    const fragmentShader = `#version 300 es
      precision highp float;

      uniform sampler2D u_texture;

      in vec2 v_texCoord;
      in vec4 v_color;
      out vec4 outColor;

      void main() {
        outColor = texture(u_texture, v_texCoord) * v_color;
      }
    `;

    this.programs.sprite = this.createProgram(vertexShader, fragmentShader);
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    // Get attribute and uniform locations
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    const attributes = {};
    for (let i = 0; i < numAttributes; i++) {
      const info = gl.getActiveAttrib(program, i);
      attributes[info.name] = gl.getAttribLocation(program, info.name);
    }

    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    const uniforms = {};
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attributes, uniforms };
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  createBuffers() {
    const gl = this.gl;

    // Create vertex buffer
    this.vertexBuffer = gl.createBuffer();

    // Create index buffer for quads
    const indices = new Uint16Array(this.maxBatchSize * 6);
    for (let i = 0; i < this.maxBatchSize; i++) {
      const offset = i * 4;
      const indexOffset = i * 6;
      indices[indexOffset + 0] = offset + 0;
      indices[indexOffset + 1] = offset + 1;
      indices[indexOffset + 2] = offset + 2;
      indices[indexOffset + 3] = offset + 2;
      indices[indexOffset + 4] = offset + 3;
      indices[indexOffset + 5] = offset + 0;
    }

    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  }

  createOrthographicMatrix(left, right, bottom, top, near, far) {
    const lr = 1 / (left - right);
    const bt = 1 / (bottom - top);
    const nf = 1 / (near - far);

    return new Float32Array([
      -2 * lr, 0, 0, 0,
      0, -2 * bt, 0, 0,
      0, 0, 2 * nf, 0,
      (left + right) * lr, (top + bottom) * bt, (near + far) * nf, 1
    ]);
  }

  clear(r = 0, g = 0, b = 0, a = 1) {
    const gl = this.gl;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.drawCalls = 0;
  }

  // Draw a circle
  drawCircle(x, y, radius, color, fill = true) {
    const segments = Math.max(8, Math.floor(radius * 2));
    const vertices = [];

    const [r, g, b, a] = this.parseColor(color);

    if (fill) {
      // Center vertex
      vertices.push(x, y, r, g, b, a);

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        vertices.push(px, py, r, g, b, a);
      }

      this.drawTriangleFan(vertices);
    } else {
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        vertices.push(px, py, r, g, b, a);
      }

      this.drawLineStrip(vertices);
    }
  }

  // Draw a rectangle
  drawRect(x, y, width, height, color, fill = true) {
    const [r, g, b, a] = this.parseColor(color);

    const vertices = [
      x, y, r, g, b, a,
      x + width, y, r, g, b, a,
      x + width, y + height, r, g, b, a,
      x, y + height, r, g, b, a
    ];

    if (fill) {
      this.drawTriangleFan(vertices);
    } else {
      vertices.push(x, y, r, g, b, a); // Close the loop
      this.drawLineStrip(vertices);
    }
  }

  // Draw a line
  drawLine(x1, y1, x2, y2, color, width = 1) {
    const [r, g, b, a] = this.parseColor(color);

    const vertices = [
      x1, y1, r, g, b, a,
      x2, y2, r, g, b, a
    ];

    this.drawLines(vertices, width);
  }

  drawTriangleFan(vertices) {
    const gl = this.gl;
    const program = this.programs.shape;

    gl.useProgram(program.program);

    // Set projection matrix
    gl.uniformMatrix4fv(program.uniforms.u_projection, false, this.projectionMatrix);

    // Create and bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Set up attributes
    const stride = 6 * 4; // 6 floats per vertex
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, stride, 2 * 4);

    // Draw
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 6);
    this.drawCalls++;
  }

  drawLineStrip(vertices, width = 1) {
    const gl = this.gl;
    const program = this.programs.shape;

    gl.useProgram(program.program);
    gl.lineWidth(width);

    // Set projection matrix
    gl.uniformMatrix4fv(program.uniforms.u_projection, false, this.projectionMatrix);

    // Create and bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Set up attributes
    const stride = 6 * 4;
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, stride, 2 * 4);

    // Draw
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 6);
    this.drawCalls++;
  }

  drawLines(vertices, width = 1) {
    const gl = this.gl;
    const program = this.programs.shape;

    gl.useProgram(program.program);
    gl.lineWidth(width);

    // Set projection matrix
    gl.uniformMatrix4fv(program.uniforms.u_projection, false, this.projectionMatrix);

    // Create and bind vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Set up attributes
    const stride = 6 * 4;
    gl.enableVertexAttribArray(program.attributes.a_position);
    gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(program.attributes.a_color);
    gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, stride, 2 * 4);

    // Draw
    gl.drawArrays(gl.LINES, 0, vertices.length / 6);
    this.drawCalls++;
  }

  parseColor(color) {
    if (Array.isArray(color)) {
      return color.length === 3 ? [...color, 1] : color;
    }

    if (typeof color === 'string') {
      // Parse hex color
      if (color.startsWith('#')) {
        const hex = color.slice(1);
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;
        const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
        return [r, g, b, a];
      }
    }

    return [1, 1, 1, 1];
  }

  // Draw text using emoji/unicode
  drawText(text, x, y, size = 16, color = '#ffffff') {
    // For now, we'll use canvas 2D for text rendering
    // In a full implementation, we'd use a texture atlas with a bitmap font
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 512;
    tempCanvas.height = 128;

    tempCtx.font = `${size}px sans-serif`;
    tempCtx.fillStyle = color;
    tempCtx.fillText(text, 0, size);

    // This is a simplified version - a real implementation would
    // render to a texture and draw that texture
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width * this.pixelRatio;
    this.canvas.height = height * this.pixelRatio;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.projectionMatrix = this.createOrthographicMatrix(0, width, height, 0, -1, 1);
  }

  destroy() {
    const gl = this.gl;

    // Clean up buffers
    if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);
    if (this.indexBuffer) gl.deleteBuffer(this.indexBuffer);

    // Clean up programs
    for (const key in this.programs) {
      const program = this.programs[key];
      if (program && program.program) {
        gl.deleteProgram(program.program);
      }
    }
  }
}
