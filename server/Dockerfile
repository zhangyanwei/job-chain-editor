FROM python:3.7.3-alpine

# Do not use the `--virtual` option, because we need to make the docker build faster.
RUN apk add --no-cache --virtual .build-deps \
		gcc \
		libc-dev \
		libffi-dev \
		openssl-dev \
		make \
		git

# Make sure we use the virtualenv:
ENV PATH="/opt/venv/bin:$PATH"
RUN python -m venv /opt/venv; \
	pip install --upgrade pip

VOLUME [ "/instance" ]

# The ADD will check the content.
# Install the devops-tools
ADD http://192.168.12.45:3000/devops/devops-scripts/archive/develop.tar.gz /data/devops-tools.tar.gz
RUN pip install /data/devops-tools.tar.gz

# Install the jobeditor
COPY setup.py /data/jobeditor/
COPY jobeditor /data/jobeditor/jobeditor/
RUN pip install /data/jobeditor

# Copy the default configuration
COPY instance/application.ini /instance/

# It's default command, will expose the service at port 8080.
CMD ["waitress-serve", "--call", "jobeditor:create_app"]