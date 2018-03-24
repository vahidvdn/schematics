import { normalize, Path, relative, strings } from '@angular-devkit/core';
import { classify } from '@angular-devkit/core/src/utils/strings';
import { apply, chain, mergeWith, move, Rule, template, Tree, url } from '@angular-devkit/schematics';
import { ModuleOptions } from '../module/schema';
import { ModuleFindUtils } from '../utils/module-find.utils';
import { ModuleImportUtils } from '../utils/module-import.utils';
import { ModuleMetadataUtils } from '../utils/module-metadata.utils';
import { ServiceOptions } from './schema';

export function main(options: ServiceOptions): Rule {
  return chain([
    mergeWith(generate(options)),
    addDeclarationToModule(options)
  ]);
}

function generate(options: ServiceOptions) {
  return apply(
    url('./files'), [
      template({
        ...strings,
        ...options
      }),
      move('/src')
    ]
  );
}

function addDeclarationToModule(options: ModuleOptions): Rule {
  return (tree: Tree) => {
    const generatedDirectoryPath: string = normalize(`/src/${ options.name }`);
    const moduleToInsertPath: string = ModuleFindUtils.find(tree, generatedDirectoryPath);
    let relativePath: string = relative(moduleToInsertPath as Path, generatedDirectoryPath as Path);
    relativePath = `${ relativePath.substring(1, relativePath.length) }/${ options.name }.service`;
    let content = tree.read(moduleToInsertPath).toString();
    const symbol: string = `${ classify(options.name) }Service`;
    content = ModuleImportUtils.insert(content, symbol, relativePath);
    content = ModuleMetadataUtils.insert(content, 'components', symbol);
    tree.overwrite(moduleToInsertPath, content);
    return tree;
  };
}
