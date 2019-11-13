from setuptools import setup, find_packages

setup(
    name='Job Editor',
    version='1.0',
    long_description=__doc__,
    packages=find_packages(),
    package_data={
        'application.ini': ['jobeditor/application.ini']
    },
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        'Flask',
        'cachetools',
        'PyYaml',
        # 'devops-tools',
        'flask_restful',
        'waitress'
    ],
    # https://github.com/pypa/pip/issues/3939
    # In our docker file, will install it directly, not through the URL address.
    dependency_links=[
      'http://192.168.12.45:3000/devops/devops-scripts/archive/develop.tar.gz#egg=devops-tools-1.0',
    ]
)
