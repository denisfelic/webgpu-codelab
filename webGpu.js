export async function setupWebGpu() {

    const canvas = document.querySelector("canvas");

    if (!navigator.gpu) {
        throw new Error("Your browser doesn't supports WebGPU.");
    }

    const adapter = await navigator.gpu.requestAdapter()

    if (!adapter) {
        throw new Error('No appropriate GPU adapter found.');
    }

    const device = await adapter.requestDevice();

    // Canvas configuration
    const context = canvas.getContext('webgpu')
    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat
    });

    // Triangle vertices
    const vertices = new Float32Array([
        // X ,  Y,
        -0.8, -0.8, // Blue triangle
        0.8, -0.8,
        0.8, 0.8,

        -0.8, -0.8, // Red Triangle
        0.8, 0.8,
        -0.8, 0.8

    ]);

    // Create the buffer vertices data that will be used by Web GPU Buffer
    const vertexBuffer = device.createBuffer({
        label: 'Cell vertices',
        size: vertices.byteLength, // Total size of Vertices in bytes (12 vertices * 4 bytes "size each float point" = 48 bytes)
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    })


    // Copy the vertices data to the buffer memory
    device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices)


    // Define vertices layout 
    const vertexBufferLayout = {
        arrayStride: 8, // How the vertices array is organized, each vertice have 8 byes (two float points), 
        attributes: [{
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0,
        }]
    }


    // Clear canvas with render pass
    const encoder = device.createCommandEncoder()

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0.1, a: 1 },
            storeOp: 'store'
        }]
    });

    // Shaders
    const cellShaderModule = device.createShaderModule({
        label: 'Cell shader',
        code: `
            @vertex
            fn vertexMain(@location(0) pos: vec2f ) -> @builtin(position) vec4f {
                //   return vec4f(pos, 0, 1); // shorthand
                return vec4f(pos.x, pos.y, 0, 1);
            }

            @fragment
            fn fragmentMain() -> @location(0) vec4f {
                return vec4f(1, 0, 0, 1);
            }

        
        `
    })

    const cellRenderPipeline = device.createRenderPipeline({
        label: 'Cell pipeline',
        layout: 'auto',
        vertex: {
            module: cellShaderModule,
            entryPoint: 'vertexMain',
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: cellShaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
                format: canvasFormat
            }]
        }
    });

    pass.setPipeline(cellRenderPipeline)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.draw(vertices.length / 2) // 6 Vertices




    pass.end();

    device.queue.submit([encoder.finish()]);

}
