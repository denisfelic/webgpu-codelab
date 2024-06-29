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

    // Clear canvas with render pass
    const encoder = device.createCommandEncoder()

    const pass = encoder.beginRenderPass({
        colorAttachments: [{
            view: context.getCurrentTexture().createView(),
            loadOp: 'clear',
            clearValue: { r: 0, g: 0, b: 0.1, a: 1 },
            storeOp: 'store'
        }]
    })

    pass.end();

    device.queue.submit([encoder.finish()]);

}
