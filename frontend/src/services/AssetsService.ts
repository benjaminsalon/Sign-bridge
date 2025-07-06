const AssetsService = {
  async getFileUri(assetName: string): Promise<string> {
    // For now, assume assets are served from /assets/ folder in public
    return Promise.resolve(`/assets/${assetName}`);
  }
};

export default AssetsService;
