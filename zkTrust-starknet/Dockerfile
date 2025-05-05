FROM --platform=linux/arm64 ubuntu:22.04

# Set noninteractive installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    curl \
    git \
    libgmp-dev \
    libssl-dev \
    pkg-config \
    python3.10 \
    python3.10-dev \
    python3.10-venv \
    python3-pip \
    wget \
    unzip \
    software-properties-common \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.10 1 && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1 && \
    python -m pip install --upgrade pip

# Install python packages required for Garaga
RUN pip install fastecdsa garaga

# Install Rust (needed for Cairo tools)
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    rustup default stable && \
    rustup target add aarch64-unknown-linux-gnu

# Install Scarb directly from binaries
RUN mkdir -p /tmp/scarb && \
    cd /tmp/scarb && \
    # Download Scarb for ARM64 architecture
    wget https://github.com/software-mansion/scarb/releases/download/v2.11.4/scarb-v2.11.4-aarch64-unknown-linux-gnu.tar.gz && \
    tar -xzf scarb-v2.11.4-aarch64-unknown-linux-gnu.tar.gz && \
    # Move Scarb to /usr/local/bin for global access
    mv scarb-v2.11.4-aarch64-unknown-linux-gnu/bin/scarb /usr/local/bin/ && \
    chmod +x /usr/local/bin/scarb && \
    # Clean up
    cd / && \
    rm -rf /tmp/scarb && \
    # Verify installation
    scarb --version

# Install Starknet Foundry from binaries
RUN mkdir -p /tmp/foundry && \
    cd /tmp/foundry && \
    # Download Starknet Foundry for ARM64 architecture (Linux)
    wget https://github.com/foundry-rs/starknet-foundry/releases/download/v0.42.0/starknet-foundry-v0.42.0-aarch64-unknown-linux-gnu.tar.gz && \
    tar -xzf starknet-foundry-v0.42.0-aarch64-unknown-linux-gnu.tar.gz && \
    # Move Starknet Foundry binaries to /usr/local/bin for global access
    mv starknet-foundry-v0.42.0-aarch64-unknown-linux-gnu/snforge /usr/local/bin/ && \
    mv starknet-foundry-v0.42.0-aarch64-unknown-linux-gnu/sncast /usr/local/bin/ && \
    chmod +x /usr/local/bin/snforge /usr/local/bin/sncast && \
    # Clean up
    cd / && \
    rm -rf /tmp/foundry && \
    # Verify installation
    snforge --version || echo "snforge installation may need verification at runtime"

# Install Node.js (properly handling potential conflicts)
RUN apt-get update && \
    # First remove any existing nodejs and npm packages
    apt-get remove -y nodejs nodejs-doc libnode-dev npm && \
    apt-get autoremove -y && \
    # Download and install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
    # Load nvm and install Node.js LTS
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install --lts && \
    nvm use --lts && \
    # Update npm
    npm install -g npm@latest

# Add nvm to shell initialization files and environment
ENV NVM_DIR="/root/.nvm"
RUN echo 'export NVM_DIR="$HOME/.nvm"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc && \
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /root/.bashrc

# Create working directory
WORKDIR /app

# Clone the zkTrust repository and switch to starknet branch
RUN git clone https://github.com/hackertron/zkTrust.git && \
    cd zkTrust && \
    git checkout starknet

# Install Cairo compiler
RUN curl -L https://github.com/franalgaba/cairo-installer/raw/main/bin/cairo-installer | bash && \
    echo 'export PATH="$HOME/.cairo/target/release:$PATH"' >> ~/.bashrc

# Add environment file templates
RUN mkdir -p /app/env-templates && \
    echo 'NETWORK=testnet\n\
    PRIVATE_KEY=your_private_key_here\n\
    ACCOUNT_ADDRESS=0xYourAccountAddressHere' > /app/env-templates/contracts.env && \
    echo 'NEXT_PUBLIC_API_URL=https://zktrust.onrender.com/api\n\
    NEXT_PUBLIC_STARKNET_CONTRACT_ADDRESS=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef\n\
    NEXT_PUBLIC_STARKNET_NETWORK=testnet' > /app/env-templates/frontend.env

# Create Scarb.toml template for Cairo project
RUN mkdir -p /app/templates && \
    echo '[package]\n\
    name = "zktrust_verifier"\n\
    version = "0.1.0"\n\
    edition = "2023_01"\n\
    \n\
    [dependencies]\n\
    starknet = ">=2.3.1"\n\
    garaga = { git = "https://github.com/keep-starknet-strange/garaga.git" }\n\
    \n\
    [[target.starknet-contract]]\n\
    sierra = true' > /app/templates/Scarb.toml

# Create script for compiling and deploying contracts
RUN echo '#!/bin/bash\n\
    echo "Compiling ZKTrust Verifier contract..."\n\
    cd /app/zkTrust/contracts/zktrust_verifier\n\
    \n\
    # Check if Scarb.toml exists, create it if not\n\
    if [ ! -f "Scarb.toml" ]; then\n\
    echo "Creating Scarb.toml..."\n\
    cp /app/templates/Scarb.toml .\n\
    fi\n\
    \n\
    echo "Compiling with Scarb (modern way)..."\n\
    scarb build || echo "Scarb build failed, trying cairo-compile..."\n\
    \n\
    echo "Compiling with cairo-compile (legacy way)..."\n\
    mkdir -p target/release\n\
    cairo-compile verifier.cairo --output target/release/zktrust_verifier.json\n\
    \n\
    echo "Contract compiled. To deploy:"\n\
    echo "1. cd /app/zkTrust/contracts"\n\
    echo "2. cp /app/env-templates/contracts.env .env"\n\
    echo "3. Edit .env with your credentials"\n\
    echo "4. node deploy.js"\n' > /app/compile-contract.sh && chmod +x /app/compile-contract.sh

# Create setup script with PATH setup for Cairo
RUN echo '#!/bin/bash\n\
    # Setup nvm\n\
    export NVM_DIR="$HOME/.nvm"\n\
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"\n\
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"\n\
    \n\
    # Setup PATH for Cairo\n\
    export PATH="$HOME/.cairo/target/release:$PATH"\n\
    \n\
    echo "ZKTrust Starknet Development Environment"\n\
    echo "---------------------------------------"\n\
    echo "Tools installed:"\n\
    echo "- Python: $(python --version 2>&1)"\n\
    echo "- Rust: $(rustc --version 2>&1)"\n\
    echo "- Node.js: $(node --version 2>&1 || echo "Not properly loaded, run: source ~/.nvm/nvm.sh")"\n\
    echo "- NPM: $(npm --version 2>&1 || echo "Not properly loaded, run: source ~/.nvm/nvm.sh")"\n\
    echo "- Scarb: $(scarb --version 2>&1 || echo "Not properly installed")"\n\
    echo "- Starknet Foundry: $(snforge --version 2>&1 || echo "Not properly installed")"\n\
    echo "- Cairo Compiler: $(cairo-compile --version 2>&1 || echo "Not properly installed")"\n\
    echo "- Garaga: Installed for STARK proofs"\n\
    echo "\nProject setup:"\n\
    echo "1. Frontend: /app/zkTrust/zktrust-frontend"\n\
    echo "2. Backend: /app/zkTrust/zktrust-backend"\n\
    echo "3. Contracts: /app/zkTrust/contracts"\n\
    echo "\nGetting started:"\n\
    echo "1. Run this script first: source /app/setup.sh"\n\
    echo "2. Setup environment variables:"\n\
    echo "   - cp /app/env-templates/contracts.env /app/zkTrust/contracts/.env"\n\
    echo "   - cp /app/env-templates/frontend.env /app/zkTrust/zktrust-frontend/.env.local"\n\
    echo "3. Install project dependencies:"\n\
    echo "   - cd /app/zkTrust/zktrust-frontend && npm install"\n\
    echo "   - cd /app/zkTrust/zktrust-backend && npm install"\n\
    echo "4. Compile the contract: /app/compile-contract.sh"\n\
    echo "5. Deploy the contract: cd /app/zkTrust/contracts && node deploy.js"\n\
    echo "6. Update contract address in frontend .env.local"\n\
    echo "7. Start services:"\n\
    echo "   - Backend: cd /app/zkTrust/zktrust-backend && npm run dev"\n\
    echo "   - Frontend: cd /app/zkTrust/zktrust-frontend && npm run dev"\n\
    ' > /app/setup.sh && chmod +x /app/setup.sh

# Welcome message
CMD ["/bin/bash", "-c", "echo 'Welcome to ZKTrust Starknet development environment!' && echo 'To set up your environment, run: source /app/setup.sh' && /bin/bash"]