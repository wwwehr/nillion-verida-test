{
  description = "Development environment for Nillion & Node.js 23";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
  };

  outputs = { self, nixpkgs }:
    let
      supportedSystems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-darwin"
        "x86_64-linux"
      ];

      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      packages = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          j2_render = pkgs.callPackage ./nix/packages/j2_render { };
        }
      );

      devShells = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs
              yarn
              git
              pnpm
              zsh
            ];

            shellHook = ''
              export PROMPT="%F{cyan}%n@devShell%f:%F{yellow}%~%f%# " # Custom prompt directly
              export SHELL=$(which zsh)                              # Set Zsh as the shell
              exec $SHELL --no-rcs --no-globalrcs
            '';
          };
        }
      );
    };
}

